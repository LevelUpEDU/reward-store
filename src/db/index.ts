import {Pool, neonConfig} from '@neondatabase/serverless'
import {drizzle} from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from './schema'

// use neon with websockets - otherwise we can't do transactions
neonConfig.webSocketConstructor = ws

const pool = new Pool({connectionString: process.env.DATABASE_URL})

export const db = drizzle(pool, {schema})

export * from './schema'
export * from './queries'
