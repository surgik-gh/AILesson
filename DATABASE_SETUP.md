# Database Setup Guide

This guide explains how to set up and initialize the database for the AILesson Platform.

## Prerequisites

- PostgreSQL database (local or remote)
- Node.js 18+ installed
- npm or yarn package manager

## Setup Steps

### 1. Configure Database Connection

Update your `.env` file with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ailesson?schema=public"
```

**Examples:**

- **Local PostgreSQL**: `postgresql://postgres:password@localhost:5432/ailesson`
- **Vercel Postgres**: Use the connection string from your Vercel dashboard
- **Supabase**: Use the connection string from your Supabase project settings
- **Prisma Postgres**: Use the `prisma+postgres://` URL format (as currently configured)

### 2. Generate Prisma Client

Generate the Prisma Client based on your schema:

```bash
npm run prisma:generate
```

### 3. Run Database Migrations

Create the database tables by running migrations:

```bash
npm run prisma:migrate
```

This will:
- Create all tables defined in `prisma/schema.prisma`
- Set up relationships and constraints
- Generate a migration history

**Note:** If you encounter connection errors, ensure your database server is running and the DATABASE_URL is correct.

### 4. Seed the Database

Populate the database with initial data:

```bash
npm run prisma:seed
```

This will create:
- **10 Subjects**: Mathematics, Physics, Chemistry, Biology, Computer Science, History, Literature, Geography, English, Art
- **7 Achievements**: first_quiz, perfect_quiz, ten_quizzes, fifty_quizzes, hundred_quizzes, daily_streak_7, daily_streak_30
- **Admin Account**:
  - Email: `admin@ailesson.com`
  - Username: `админ228`
  - Password: `123456789`
  - Wisdom Coins: 999,999 (unlimited)

### 5. Verify Setup

Open Prisma Studio to verify the data:

```bash
npm run prisma:studio
```

This will open a browser interface where you can view and edit your database records.

## Running Tests

### Property-Based Tests for Database Constraints

The database constraint tests validate:
- **Property 8**: Lesson associations (every lesson has exactly one subject and one creator)
- **Property 11**: Quiz-Lesson one-to-one relationship (each quiz references exactly one lesson uniquely)

To run these tests:

```bash
npm test -- database-constraints.test.ts
```

**Important:** These tests require a running database connection. If the database is not available, the tests will skip gracefully with a warning message.

## Troubleshooting

### Connection Errors

If you see `P1001: Can't reach database server` errors:

1. **Check if PostgreSQL is running**:
   ```bash
   # On Windows (if using local PostgreSQL)
   pg_ctl status
   
   # Or check services
   services.msc
   ```

2. **Verify DATABASE_URL**: Ensure the connection string is correct and the database exists

3. **Create the database** (if it doesn't exist):
   ```sql
   CREATE DATABASE ailesson;
   ```

### Migration Errors

If migrations fail:

1. **Reset the database** (⚠️ This will delete all data):
   ```bash
   npx prisma migrate reset
   ```

2. **Create a new migration**:
   ```bash
   npx prisma migrate dev --name init
   ```

### Prisma Client Errors

If you see "PrismaClient needs to be constructed" errors:

1. Regenerate the Prisma Client:
   ```bash
   npm run prisma:generate
   ```

2. Restart your development server

## Database Schema Overview

The platform uses the following main models:

- **User**: Students, Teachers, and Admins with role-based access
- **Expert**: AI avatars with personalities and communication styles
- **Subject**: Educational subjects (Math, Physics, etc.)
- **Lesson**: Learning materials created by teachers
- **Quiz**: Auto-generated quizzes linked to lessons
- **Question**: Quiz questions (text, single choice, multiple choice)
- **Achievement**: Gamification achievements
- **LeaderboardEntry**: Daily student rankings
- **TokenTransaction**: Wisdom coins transaction history
- **ChatMessage**: Student-Expert chat history
- **UserSettings**: User preferences (theme, etc.)

For the complete schema, see `prisma/schema.prisma`.

## Next Steps

After setting up the database:

1. Continue with **Task 3**: Authentication system with NextAuth.js
2. Start the development server: `npm run dev`
3. Access the application at `http://localhost:3000`

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Database Guide](https://nextjs.org/docs/app/building-your-application/data-fetching)
