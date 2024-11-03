import postgres from 'postgres';
import { RedisClientType } from 'redis';
import { Resolvers, User, Item, AddUserInput, MutationPurchaseArgs } from 'graphql/__generated__/schema-types';

//Apollo GrahpQL 
export interface ApolloContext {
    sqlClient:  postgres.Sql<{}>
    redisClient: RedisClientType<any, any, any>
 }