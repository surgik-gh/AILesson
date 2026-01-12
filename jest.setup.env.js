// This file runs BEFORE the test environment is set up
// Set DATABASE_URL before anything else
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_DRn9hraXufc3@ep-super-river-ahyyeoly-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
}

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
