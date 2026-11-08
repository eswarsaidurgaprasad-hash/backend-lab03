# Postman Test List

Base URL: `http://localhost:3000`

| # | Request | Expected |
|---|---|---|
| 1 | GET `/` | 200 |
| 2 | GET `/books` | 200 |
| 3 | GET `/books?search_q=the` | 200 |
| 4 | GET `/books?order_by=price&order=DESC` | 200 |
| 5 | GET `/books?min_price=200&max_price=500` | 200 |
| 6 | GET `/books?limit=3&offset=2` | 200 |
| 7 | GET `/books?order_by=unknown` | 400 |
| 8 | GET `/books?order=wrong` | 400 |
| 9 | GET `/books?limit=0` | 400 |
| 10 | GET `/books?min_price=500&max_price=100` | 400 |
| 11 | GET `/books/1` | 200 |
| 12 | GET `/books/99999` | 404 |
| 13 | POST `/books` with valid JSON | 201 |
| 14 | POST `/books` without title | 400 |
| 15 | POST `/books` with `"price":"abc"` | 400 |
| 16 | PUT `/books/1` with valid JSON | 200 |
| 17 | PUT `/books/99999` with valid JSON | 404 |
| 18 | DELETE `/books/10` | 200 |
| 19 | DELETE `/books/99999` | 404 |

Valid POST/PUT body: `{"title":"Example Book","author":"Example Author","price":250}`
