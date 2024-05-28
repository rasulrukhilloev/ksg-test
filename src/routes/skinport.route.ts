import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';
import client from '../db/db';


interface SkinportItem {
  market_hash_name: string;
  currency: string;
  suggested_price: number;
  item_page: string;
  market_page: string;
  min_price: number | null;
  max_price: number | null;
  mean_price: number | null;
  quantity: number;
  created_at: number;
  updated_at: number;
}
export async function skinportRoutes(server: FastifyInstance) {
  server.get('/items', async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as { page: number; limit: number };
    const cacheKey = `skinport_items_${page}_${limit}`;
    const redisClient = server.redis;
    const cachedItems = await redisClient.get(cacheKey);

    if (cachedItems) {
      return reply.send(JSON.parse(cachedItems));
    }

    try {
      const [tradableResponse, nonTradableResponse] = await Promise.all([
        fetch(`${process.env.SKINPORT_URL}/items?tradable=1&app_id=730&currency=EUR`),
        fetch(`${process.env.SKINPORT_URL}/items?tradable=0&app_id=730&currency=EUR`),
      ]);

      const tradableItems: SkinportItem[] = await tradableResponse.json() as SkinportItem[];
      const nonTradableItems: SkinportItem[] = await nonTradableResponse.json() as SkinportItem[];

      const tradablePricesMap = tradableItems.reduce((acc, item) => {
        acc[item.market_hash_name] = item.min_price;
        return acc;
      }, {} as Record<string, number | null>);

      const nonTradablePricesMap = nonTradableItems.reduce((acc, item) => {
        acc[item.market_hash_name] = item.min_price;
        return acc;
      }, {} as Record<string, number | null>);

      const combinedItems = [...tradableItems, ...nonTradableItems].map(item => {
        const tradable_price = tradablePricesMap[item.market_hash_name] || 'N/A';
        const nonTradable_price = nonTradablePricesMap[item.market_hash_name] || 'N/A';

        return {
          market_hash_name: item.market_hash_name,
          currency: item.currency,
          suggested_price: item.suggested_price,
          item_page: item.item_page,
          market_page: item.market_page,
          tradable_price,
          nonTradable_price,
          mean_price: item.mean_price,
          quantity: item.quantity,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      });

      const uniqueItems = combinedItems.reduce((acc, item) => {
        if (!acc.find(existingItem => existingItem.market_hash_name === item.market_hash_name)) {
          acc.push(item);
        }
        return acc;
      }, [] as typeof combinedItems);

      const start = (page - 1) * limit;
      const end = start + limit;

      const paginatedItems = uniqueItems.slice(start, end);

      // Cache for 5 minutes (300 seconds)
      await redisClient.set(cacheKey, JSON.stringify(paginatedItems), 'EX', 300);

      reply.send(paginatedItems);
    } catch (error) {
      console.log(error)
      reply.status(500).send({ error: 'Failed to fetch items' });
    }
  });

  server.post('/deduct-balance', async (request, reply) => {
    const userId = 1;
    const amountToDeduct = 100;

    try {
      const userQuery = await client.query('SELECT balance FROM users WHERE id = $1', [userId]);
      const user = userQuery.rows[0];

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      if (user.balance < amountToDeduct) {
        return reply.status(400).send({ error: 'Not enough balance' });
      }

      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amountToDeduct, userId]);

      reply.send({ success: true, newBalance: user.balance - amountToDeduct });
    } catch (error) {
      reply.status(500).send({ error: 'Database error' });
    }
  });
}