# LevelUpEDU Setup Instructions

## Database Setup

### 1. Install PostgreSQL

**Windows:**
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE levelupedu;

# Create user (optional, you can use postgres user)
CREATE USER levelup_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE levelupedu TO levelup_user;

# Exit psql
\q
```

### 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/levelupedu

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-make-it-long-and-random-at-least-32-characters
NEXTAUTH_URL=http://localhost:8080
```

**Replace the values:**
- `username`: Your PostgreSQL username (usually `postgres`)
- `password`: Your PostgreSQL password
- `your-secret-key-here...`: Generate a random 32+ character string

### 4. Run Database Schema

Run the complete database schema:

```bash
# Connect to your database
psql -U postgres -d levelupedu

# Run the schema file
\i database_schema.sql

# Exit
\q
```

### 5. Start Development Server

```bash
pnpm install
pnpm dev
```

## Alternative: Cloud Database (No Local Installation)

If you don't want to install PostgreSQL locally, you can use a cloud service:

### Option 1: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free
3. Create a new database
4. Copy the connection string
5. Use it in your `.env.local` file

### Option 2: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the connection string from Settings > Database
4. Use it in your `.env.local` file

### Option 3: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Get the connection string
4. Use it in your `.env.local` file

## Testing the Setup

1. Start the development server: `pnpm dev`
2. Visit `http://localhost:8080`
3. Try to sign up for a new account
4. Check if the user is created in your database:

```sql
-- Connect to your database
psql -U postgres -d levelupedu

-- Check if users are being created
SELECT * FROM student;
SELECT * FROM instructor;

-- Exit
\q
```

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your connection string format
- Verify username and password
- Ensure the database exists

### Environment Variables
- Make sure `.env.local` is in the project root
- Restart the development server after changing environment variables
- Check that all required variables are set

### Schema Issues
- Make sure you ran the complete `database_schema.sql`
- Check for any error messages during schema execution
- Verify all tables were created: `\dt` in psql
