import {drizzle} from 'drizzle-orm/node-postgres'
import type {NodePgDatabase} from 'drizzle-orm/node-postgres'
import {newDb} from 'pg-mem'
import {readdirSync, readFileSync} from 'fs'
import {join} from 'path'
import * as schema from '../src/db/schema'
import type * as pg from 'pg'

// create an in memory postgres db to test with
export async function setupTestDb(): Promise<
    NodePgDatabase<typeof schema> & {pgPromise: any}
> {
    const mem = newDb()
    const pgPromise = mem.adapters.createPgPromise()
    
    // Create a mock pg Client that uses pg-promise
    // Note: pg-promise requires named prepared statements, but drizzle uses unnamed ones
    // This is a known limitation - we'll use direct SQL queries for cleanup
    const mockClient = {
        query: (query: string | {text: string; values?: unknown[]}, params?: unknown[]) => {
            // Handle both string queries and query objects
            let text: string
            let values: unknown[] | undefined
            
            if (typeof query === 'string') {
                text = query
                values = params
            } else {
                text = query.text
                values = query.values || params
            }
            
            // Generate a unique name for each query to satisfy pg-promise
            const queryName = `query_${Math.random().toString(36).substring(7)}`
            return pgPromise.query({text, values, name: queryName})
        },
        connect: async () => {},
        end: async () => {},
    } as unknown as pg.Client
    
    const db = drizzle(mockClient, {schema})
    ;(db as any).pgPromise = pgPromise

    // get files in migrations directory
    const migrationsDir = join(__dirname, '../drizzle')
    const migrationFiles = readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort() // sort in ascending order

    // apply migrations sequentially
    for (const file of migrationFiles) {
        const sql = readFileSync(join(migrationsDir, file), 'utf-8')
        await pgPromise.query(sql)
    }

    return db as unknown as NodePgDatabase<typeof schema> & {pgPromise: any}
}
