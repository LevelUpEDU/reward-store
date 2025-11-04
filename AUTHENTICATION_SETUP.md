# Authentication Setup Guide

This guide explains the authentication system that has been added to LevelUpEDU.

## Features Added

### 1. Home Page with Authentication
- **Location**: `src/app/page.tsx`
- **Features**:
  - Beautiful landing page with sign up & login functionality
  - User type detection (Student vs Instructor)
  - Automatic redirection based on user type
  - Responsive design with modern UI

### 2. Authentication Components
- **LoginForm**: `src/app/components/LoginForm.tsx`
- **SignUpForm**: `src/app/components/SignUpForm.tsx`
- **Styling**: `src/app/components/AuthForm.css`

### 3. Database Schema Updates
- Added `password` field to both `student` and `instructor` tables
- Password hashing using bcrypt
- Migration script: `src/db/migrations/add_password_fields.sql`

### 4. API Endpoints
- **Registration**: `POST /api/auth/register`
- **Authentication**: Updated NextAuth configuration
- **User Types**: Supports both student and instructor accounts

### 5. Navigation
- **Home Page**: Root route (`/`) with authentication
- **Game Page**: Navigation to home and instructor dashboard
- **Instructor Dashboard**: Navigation to home and game
- **Logout**: Proper session management

## User Flow

### New Users
1. Visit home page (`/`)
2. Click "Sign Up"
3. Fill out registration form (name, email, password, user type)
4. Account created and automatically logged in
5. Redirected based on user type:
   - **Students**: Redirected to game (`/game`)
   - **Instructors**: Redirected to instructor dashboard (`/instructor`)

### Existing Users
1. Visit home page (`/`)
2. Click "Sign In"
3. Enter email and password
4. Automatically redirected based on user type

### Navigation
- **Home**: Accessible from all pages
- **Game**: Available to all users
- **Instructor Dashboard**: Only visible to instructors
- **Logout**: Available from all authenticated pages

## Database Migration

If you have an existing database, run the migration script:

```sql
-- Add password column to student table
ALTER TABLE student ADD COLUMN password VARCHAR NOT NULL DEFAULT '';

-- Add password column to instructor table  
ALTER TABLE instructor ADD COLUMN password VARCHAR NOT NULL DEFAULT '';
```

**Important**: After running this migration, existing users will need to reset their passwords or you should implement a password reset flow.

## Environment Variables

Make sure you have the following environment variables set:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:8080
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- Secure session management with NextAuth
- User type validation
- Input validation and error handling
- CSRF protection through NextAuth

## Styling

- Modern, responsive design
- Gradient backgrounds and smooth animations
- Mobile-friendly interface
- Consistent color scheme across all pages
- Professional form styling with validation states

## Testing

To test the authentication system:

1. Start the development server: `pnpm dev`
2. Visit `http://localhost:8080`
3. Try creating a new account (both student and instructor)
4. Test login with different user types
5. Verify navigation between pages
6. Test logout functionality

## Future Enhancements

- Password reset functionality
- Email verification
- Social login (Google, GitHub, etc.)
- Two-factor authentication
- User profile management
- Remember me functionality
