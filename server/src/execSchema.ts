import { readFileSync } from 'fs';
import { Resolvers, User, Item, AddUserInput, MutationPurchaseArgs } from 'graphql/__generated__/schema-types';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { addMocksToSchema } from '@graphql-tools/mock';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { ApolloContext } from 'graphql/apollo-context';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const typeDefs = readFileSync(path.resolve(__dirname,'../schema.graphql'), { encoding: 'utf-8' });

// const getOpeningPhrase = ({title, director, studio}: Movie) => {
//   return `${studio} presents, ${title}, by ${director}`
// }

const resolvers: Resolvers = {
  User: { 
    purchases: async (parent, args, context: ApolloContext , info) => {
    // Purchases ordered by time_created (time of purchase)
     // Note that if multiple buys of the same item is made
     // we might want add GROUP BY item_id.
      const items: Item[] = await context.sqlClient<Item[]>`
      SELECT 
      i.id,
      i.name,
      i.currency,
      i.min_price as "minPrice",
      i.max_price as "maxPrice",
      i.tradable,
      i.quantity,
      i.item_page as "itemPage",
      i.created_at as "createdAt" 
      FROM purchases p
      JOIN items i ON i.id = p.item_id
      WHERE p.user_id = ${parent.id}
      ORDER BY p.time_created DESC
      `;
      return items
    }
  },
  Query: {
    login: async (parent, args, context: ApolloContext , info) => {
      // In production: we would hash the arg/string and compare 
      // this hashed password to the hash in database.
      const user: User[] = await context.sqlClient<User[]>`
      SELECT 
      id,
      time_created as "timeCreated", 
      TRUNC( balance::bigint / 1000000, 2) as "balance",
      currency,
      name,
      lang,
      email
      FROM users
      WHERE email = ${args.email} AND passhash = ${args.password}
      `;
      if (!user.length) { throw new Error('Incorrect email or password'); }
      return user[0];
    },
    user: async (parent, args, context: ApolloContext, info) => {
      // Note: Injections are handled by postgres.js: https://github.com/porsager/postgres/issues/15#issuecomment-574055183 so it's safe to pass args
      const user: User[] = await context.sqlClient<User[]>`
      SELECT 
      id,
      time_created as "timeCreated",
      TRUNC( balance::bigint / 1000000, 2) as "balance",
      currency,
      name,
      lang,
      email
      FROM users 
      WHERE id = ${args.userId}`;
      if (!user.length) { throw new Error('User not found'); }
      return user[0]
    },
    items: async (parent, args, context: ApolloContext, info) => {
    
    //  Redis cache implmentation
    // --> const items = context.redisClient.hGet('items');
    // --> return items in json/array [{}, {}, {}]
    // I didn't implement it since we would need a mutex/locking
    // mechanism especially when quantity changes in
    // purchase(). For that we could use Redlock package.

      try { 
        const items: Item[] = await context.sqlClient<Item[]>`
        SELECT 
        id,
        name,
        currency,
        min_price as "minPrice",
        max_price as "maxPrice",
        tradable,
        quantity,
        item_page as "itemPage",
        created_at as "createdAt"
        FROM items 
        ORDER BY id DESC`;
        return items
      } catch (err) {
        return err;
    }
    
    },

    
  },
 
  Mutation: {
    purchase: async (parent, args, context: ApolloContext, info) => {
      const { itemId } = args;
      const userId = '0192e77e-553b-78fa-985d-ab962a062319'; 
      
    
        // Here we are just using maxPrice (buy at market price)
        // - not a limit order,
        // and checking that item is in stock
        const item: Item[] = await context.sqlClient<Item[]>`
          SELECT 
          max_price as "maxPrice"
          FROM items
          WHERE id = ${itemId} AND quantity > 0
        `;
        if (!item.length) { throw new Error('Item not found OR out of stock'); }

        const itemPrice: number = item[0].maxPrice;

        // - Subtract our user's balance
        // - Decrease item quantity
        // - Add item to purchases
        // Using pipeline (1 extra connection)
        const pipeline = await context.sqlClient.begin((sql: postgres.Sql)  => [
        sql`
        UPDATE users SET balance = balance - ${itemPrice}
        WHERE id = ${userId}`,
        sql`
          UPDATE items SET quantity = quantity - 1
          WHERE id = ${itemId}`,

        sql`
          INSERT INTO purchases (
            user_id,
            item_id
          ) VALUES (
            ${ userId },
            ${ itemId }
          )`
        ]);
 
        // Get the user 
        const user: User[] = await context.sqlClient<User[]>`SELECT 
        id,
        time_created as "timeCreated",
        TRUNC( balance::bigint / 1000000, 2) as "balance",
        currency,
        name,
        lang,
        email
        FROM users 
        WHERE id = ${userId}`;
          
        return user[0];

      
  
    },
    editUser: async (parent, args, context: ApolloContext, info) => {
      // Using only password for now... 
      const { password, name, lang, currency } = args.input;
      // userId: in real world we would get userId (from cookie/jwt)
      // and pass it through ApolloContext to access here.
      const userId = '0192e77e-553b-78fa-985d-ab962a062319';  
      // And of course bcz we are changing password
      // we would also need to validate that it has all the requirements.
      // For example: validatePassword() that would've been used in addUser query as well.
      // And we also need to hash the new password before storing in db.
     if (password && password.length < 5) { throw new Error('Password not provided OR too short'); }
     // Update password and return user back
      const user: User[] = await context.sqlClient<User[]>`
      UPDATE users SET passhash = ${password!}
      WHERE id = ${userId}
      RETURNING
      id,
      time_created as "timeCreated",
      TRUNC( balance::bigint / 1000000, 2) as "balance",
      currency,
      name,
      lang,
      email
      `;
      if (!user) { throw new Error('User not found'); }
      return user[0];
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs: [
   // ...scalarTypeDefs,
    typeDefs
  ], 
  resolvers: {
   // ...scalarResolvers,
    ...resolvers,
  },
})

export const execSchema = schema;

 