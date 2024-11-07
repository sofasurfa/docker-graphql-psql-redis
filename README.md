## Server (NodeJS, Apollo GraphQL), Redis, PSQL (PostgresDB) via 3 Docker containers
### Initially was a "pre-interview task" for a gaming company to store CSGO items and allows:
- Users to login
- Change password
- Show all items in DB
- Purchase an item and return all the purchases made with the new balance (SQL update `$new_balance` = `$previous_balance` - `$item_pice`)
  

#### 👌 Notable things:  

- `tsconfig.json` configured to be in strict mode
- Use Docker **“secrets”** for important things like passwords, DB URLs, etc..
- .dockerignore for "secrets"
- For **user balance:** I used “micro-dollar” a concept used in financial industry to store money in a SQL database: `$amount * 1m`
- Utilise **Postgres.js pipelining** via transaction in `purchase()`
- Allowed **currencies** enum (USD, EUR, RUB, etc..) see `users` table in `init.db` 
- `purchases` resolver in `User` GraphQL type, so we can do `user(id: **) { name, purchases { id, name, minPrice, tradable }}`
- **Password hashing/salting** (not implemented yet in Node, but I laid the foundation and left links to my research in SQL comments)
- Installed (via `curl` in `psql/Dockerfile`) **UUID.v7** as a `postgres extension` in `init.db` (UUID.v7 allows us to `ORDER BY id DESC`)
- Graceful shutdown for GraphQL (using `ApolloServerPluginDrainHttpServer()`)
- Built endpoints 1,2,3,4 accessed by GraphQL's playground



## Things to work on:
- Tests via Jest
- **Caching** bcz it's not as simple as using `hSet/hGet` and storing items as a JSON string (I implemented caching in GoLang before). In our case `items` can change `quantity` that means we would need a `mutex` during `purchase()`, and prevent `hSet` while value is being changed. So we would need to use something like [Redlock](https://medium.com/@ayushnandanwar003/achieving-distributed-locking-in-node-js-with-redis-and-redlock-0574f5ac333d). Here's more [Redlock stuff](https://blog.dennisokeeffe.com/blog/2021-10-04-locking-redis-transactions-in-nodejs).
- Write a script to scan the Skinport API to include/insert all of “items” into the items table, so I just wrote some INSERTs in `/psql/init.db`
- The table `items` only has some fields/rows compared to the Skinport API's json response 
- Implement password hashing/salting via `bcrypt` OR using a `PSQL function`
- Use Cookies for session (as JWT is not allowed). So I just used user's UUID defined prior in a variable in `WHERE` SQL queries. In real world we would get current user's `userId` (from cookie/jwt) and pass it through `ApolloContext` to use in our database/redis/etc..  
- GraphQL custom error handling & **error logging**
- Show balance only to the account owner
- **Also look at the code comments as I describe what I would do in production :)**


## Why 3 Docker containers (server, psql, redis)? 🤔 
These concepts are from my previous projects/experience, and the reasoning is: it’s easier to expand to a new machine by just copying the folders like `/redis` or `/psql` in case we need more disk space for **Postgres** or more RAM/Memory for **Redis**.  


## How to run? 🤷‍♂️ 
1) `cd` into the pulled/downloaded project directory
2) Duplicate 2 more tabs in your terminal (you should now have 3 tabs)
3) Tab 1: `cd psql` >> `docker compose up`
4) Tab 2: `cd redis` >> `docker compose up`
5) Tab 3: `cd server/docker` >> `docker compose up`
6) Great! Now visit [localhost/graphql](http://localhost/graphql) to run some GraphQL queries 🚀 

### GraphQL queries for the endpoints (copy & paste) 🎉 

#### Endpoint 1 (login)
```
query { login(email: "user@mail.com", password: "12345") { id, name, lang, currency, balance } }
```
 

#### Endpoint 2 (change password)
```
mutation { 
   editUser(input: {password: "123456789"}) { id, name, lang, balance }
}
```
> **Try to run Endpoint 1 login query again = ❌ Error**

> **To see password change in DB:** 
RUN (in your terminal) `psql postgres://main:maindb-pas-36754321@localhost:28802/main_db` THEN `SELECT passhash from users;`.

 

#### Endpoint 3 (items)
```
query { items { 
id,
name,
currency,
minPrice,
maxPrice,
quantity,
itemPage,
tradable,
createdAt
}}
```
> Note: only 1 item in items table 
 
#### Endpoint 4 (purchase)
```
mutation { 
    purchase(itemId: "0192f17a-ec4b-7a06-8923-01c011ca1912") {
      id,
      name,
      balance,
      purchases {
        id,
        name,
        quantity
      }
    }
}
```
> Run query multiple times, and see user's balance decrease


 



