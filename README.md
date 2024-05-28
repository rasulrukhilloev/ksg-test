SOLUTION: <br>
1) Endpoint /items fetches tradable and non-tradable items and gets their minimum_price which is set as tradable_price and nontradable_price
2) I setup database via setupDB file which creates user table and adds a user with ID=1 and balance=500 to check ENDPOINT 2

INSTRUCTIONS TO RUN:
1) docker-compose build
2) docker-compose up

TEST QUESTION:
Функционал

endpoint 1:

Нужно обратиться к списку предметов skinport (https://docs.skinport.com/#items) и отобразить массив объектов, где помимо прочего должны быть указаны две минимальные цены на предмет (одна цена — tradable, другая — нет) параметры app_id и currency - default, базу здесь использовать не нужно, в эндпоинте необходимо использовать кеширование

endpoint 2:

Есть табличка users с полями id и balance, там есть один юзер с id = 1
Необходимо реализовать списание баланса пользователя
Пример: юзер покупает какой-то предмет на сайте за $100

