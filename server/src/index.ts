import express from 'express';
import { ApolloServer } from '@apollo/server';
import {expressMiddleware} from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import postgres from 'postgres';
import { createClient, RedisClientType } from 'redis';
// Local 
import { execSchema } from './execSchema.js';
import { sqlClient } from './db/client.js';
import { ApolloContext } from './graphql/apollo-context.js';
 
// const testSql = async (req: any, res: any, next: any) => {
//   console.log('testSql');
//   const items = await sqlClient`SELECT * FROM items ORDER BY id DESC`;
//   console.log('Items ---->'+items);
//   next(true);
// }
  
//Create Express app/server
const app = express();
const httpServer = http.createServer(app);
// Redis client

const redisClient = await createClient({url:process.env.REDIS_URL})
  .on('error', err => console.log('Redis Client Error', err))
  .connect();
  
// TEST REDIS CLIENT
// await redisClient.set('key', 'TEST_VALUE');
// const redisTest = await redisClient.get('key');
// console.log(redisTest);
// await redisClient.disconnect();


const apolloServer = new ApolloServer<ApolloContext>({
  schema: execSchema,
  introspection: true,
  plugins: [ApolloServerPluginDrainHttpServer({httpServer})], // for graceful shutdown
 });

// Start server
await apolloServer.start();

// Cors Options
const corsOptions: cors.CorsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
}

// Middlewares
app.use(
  // testSql,
  cors<cors.CorsRequest>(corsOptions),
  bodyParser.json(),
);

// Apollo GraphQl
app.use(
  '/graphql',
  expressMiddleware(apolloServer, {
    context: async () => ({sqlClient: sqlClient, redisClient: redisClient})
  })
);

const port = 8000;

await new Promise<void>((resolve) => httpServer.listen({port: port}, resolve));

console.log(`Server listening at: ${port}`);