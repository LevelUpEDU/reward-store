// src/db/index.ts

import {drizzle} from 'drizzle-orm/node-postgres'
import {Client} from 'pg'
import * as schema from './schema'

// Use PostgreSQL with DATABASE_URL from environment
const client = new Client({
    connectionString: process.env.DATABASE_URL,
})

// Connect to the database
await client.connect()

export const db = drizzle(client, {schema})
