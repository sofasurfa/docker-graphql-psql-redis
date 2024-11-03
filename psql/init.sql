
-- Don't need this below, because Docker sets this via compose.yml
-- POSTGRES_USER/DB/PAS_FILE will do the job
--- 
-- CREATE USER main WITH password = 'maindb-pas-****';
-- CREATE DATABASE main_db WITH OWNER main;
-- GRANT ALL PRIVILEGES ON DATABASE main_db TO main;


-- DEV TESTING: To access db locally: psql postgres://main:maindb-pas-36754321@localhost:28801/main_db

-- add extensions
CREATE EXTENSION pg_uuidv7;

-- set time zone for CURRENT_TIMESTAMP
SET timezone TO 'UTC';


CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), 
  time_created timestamp DEFAULT CURRENT_TIMESTAMP,
  -- last_robot_check_time if user signup that means
  -- robot check must've been completed, thus set time.
  balance bigint DEFAULT 0, -- Micro-dollar (https://heyfirst.co/blog/micro-dollar)
  currency varchar(3) CHECK (currency IN ('USD', 'RUB', 'EUR', 'GBP')),
  name varchar(30) NOT NULL, 
  -- image text NOT NULL, -- decided not to have profile images
  -- device_id text DEFAULT NULL, -- for notifications, can be null in case someone is running other OS like on web
  lang varchar(2) NOT NULL, -- (country code) the lang that was used when creating account 
  email varchar(100) NOT NULL,
  -- HOW TO STORE PASSWORDS
  -- https://stackoverflow.com/questions/247304/what-data-type-to-use-for-hashed-password-field-and-what-length
  -- https://stackoverflow.com/questions/5881169/what-column-type-length-should-i-use-for-storing-a-bcrypt-hashed-password-in-a-d 
  passhash CHAR(60) NOT NULL -- TODO: MUST BE SALTED/HASHED IN PRODUCTION!!
);
 

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  name varchar(200) NOT NULL, -- eg: AK-47 | Aquamarine Revenge
  currency varchar(3) CHECK (currency IN ('USD', 'RUB', 'EUR', 'GBP')),  
  min_price bigint NOT NULL DEFAULT 0, -- Micro-dollar (https://heyfirst.co/blog/micro-dollar)
  max_price bigint NOT NULL DEFAULT 0,
  tradable boolean NOT NULL DEFAULT FALSE,
  quantity smallint NOT NULL DEFAULT 0,
  item_page text DEFAULT NULL,
  created_at bigint NOT NULL -- UNIX timestamp from API
);

  
-- ON DELETE CASCADEs mean in case item or user is deleted
-- the purchase(s) are removed from table automatically.
CREATE TABLE purchases (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  time_created timestamp DEFAULT CURRENT_TIMESTAMP
  -- Here we can have a "price" row so user knows
  -- at what price the buy was made 
);
-- For qucik lookups of items per user, create an index
CREATE INDEX purchase_item_index ON purchases (user_id, item_id);  
 
  
---
-- INSERT FAKE DATA
---

-- FAKE USER, 
-- Notes: password must be SALTED/HASHED IN PRODUCTION!
-- We are using a pre-defined id(UUID.v7) for testing 
-- Balance: $1000 * 1m = 1000000000 micro-dollar
INSERT INTO users (id, name, lang, balance, currency, email, passhash) VALUES ('0192e77e-553b-78fa-985d-ab962a062319', 'user', 'en', 1000000000, 'USD', 'user@mail.com', '12345');

-- FAKE ITEM
INSERT INTO items (
id,
name,
currency,
min_price,
max_price,
quantity,
item_page,
tradable,
created_at
) VALUES (
  '0192f17a-ec4b-7a06-8923-01c011ca1912',
  'AK-47 | Aquamarine Revenge (Battle-Scarred)', 
  'EUR',
  11330000, -- 11.33 * 1m = micro-dollar
  18220000,
  25,
  'https://skinport.com/item/csgo/ak-47-aquamarine-revenge-battle-scarred',
  TRUE,
  1535988253
);



 