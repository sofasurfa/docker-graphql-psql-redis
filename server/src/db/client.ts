import postgres from 'postgres'

// DB_URL provided via Docker using secrets 
const dbUrl = process.env.DB_URL ?? ''

// We would probably need to add options in production
// to fine-tune the client/pool.
export const sqlClient = postgres(dbUrl, {
  // ... options
})

