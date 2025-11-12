// Set dummy DATABASE_URL to prevent neon() from failing during imports
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

