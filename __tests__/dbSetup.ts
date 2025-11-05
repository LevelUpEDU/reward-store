import {drizzle} from 'drizzle-orm/postgres-js'
import type {PostgresJsDatabase} from 'drizzle-orm/postgres-js'
import {newDb} from 'pg-mem'
import {readdirSync, readFileSync} from 'fs'
import {join} from 'path'
import * as schema from '../src/db/schema'

// create an in memory postgres db to test with
export async function setupTestDb(): Promise<
    PostgresJsDatabase<typeof schema>
> {
    const mem = newDb()
    const pgClient = mem.adapters.createPgPromise()
    const db = drizzle(pgClient, {schema})

    // get files in migrations directory
    const migrationsDir = join(__dirname, '../drizzle')
    const migrationFiles = readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort() // sort in ascending order

    // apply migrations sequentially
    for (const file of migrationFiles) {
        const sql = readFileSync(join(migrationsDir, file), 'utf-8')
        await pgClient.query(sql)
    }

    return db
}
