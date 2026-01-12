# AILesson Platform - Deployment Guide

## Prerequisites

Before deploying to Vercel, ensure you have:

1. A Vercel account (free tier is sufficient)
2. A PostgreSQL database (Vercel Postgres or Supabase)
3. OpenRouter API key (free tier available)
4. Groq API key (optional, for fallback)
5. Git repository connected to GitHub

## Environment Variables Setup

### Required Environment Variables

You need to configure the following environment variables in Vercel:

#### Database
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database?schema=public`
  - For Vercel Postgres: Use the connection string from Vercel dashboard
  - For Supabase: Use the connection pooler URL

#### Authentication
- `NEXTAUTH_URL`: Your application URL
  - Development: `http://localhost:3000`
  - Production: `https://your-app.vercel.app`
- `NEXTAUTH_SECRET`: Random secret for session encryption
  - Generate with: `openssl rand -base64 32`

#### AI Services
- `OPENROUTER_API_KEY`: Your OpenRouter API key
  - Get from: https://openrouter.ai/keys
  - Free tier available with rate limits
- `GROQ_API_KEY`: Your Groq API key (optional)
  - Get from: https://console.groq.com/keys
  - Used as fallback for faster responses

#### Application Configuration
- `CHAT_COST_PER_MESSAGE`: Cost in wisdom coins per chat message (default: 5)
- `MAX_FILE_SIZE_MB`: Maximum file upload size in MB (default: 10)
- `ALLOWED_FILE_TYPES`: Comma-separated list of allowed file extensions (default: "pdf,png,jpg,jpeg,txt")

### Setting Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate values
4. Select the environments (Production, Preview, Development)
5. Click "Save"

## Database Setup

### Option 1: Vercel Postgres

1. In Vercel dashboard, go to Storage tab
2. Create a new Postgres database
3. Copy the connection string
4. Add it as `DATABASE_URL` environment variable

### Option 2: Supabase

1. Create a new project at https://supabase.com
2. Go to Project Settings → Database
3. Copy the "Connection Pooling" connection string
4. Add it as `DATABASE_URL` environment variable

### Running Migrations

After setting up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the `ailesson-platform` directory as the root
4. Vercel will auto-detect Next.js configuration

### 3. Configure Build Settings

Vercel should automatically use the settings from `vercel.json`:
- Build Command: `prisma generate && next build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. Add Environment Variables

Add all required environment variables as listed above.

### 5. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment

### 1. Verify Database Connection

Check that the database is accessible and migrations ran successfully:
- Visit `/api/subjects` to verify database connectivity
- Check Vercel logs for any database errors

### 2. Test Authentication

- Try registering a new user
- Try logging in
- Verify role-based redirects work

### 3. Test AI Services

- Create a lesson to test OpenRouter integration
- Send a chat message to test expert responses
- Verify fallback to Groq if OpenRouter fails

### 4. Seed Admin Account

If not already seeded, create an admin account:
- Login: админ228
- Password: 123456789

### 5. Monitor Performance

- Check Vercel Analytics for performance metrics
- Monitor API response times
- Watch for any errors in Vercel logs

## Troubleshooting

### Build Failures

**Issue**: Prisma client generation fails
- **Solution**: Ensure `DATABASE_URL` is set in environment variables
- **Solution**: Check that Prisma schema is valid

**Issue**: Next.js build fails
- **Solution**: Check for TypeScript errors
- **Solution**: Verify all dependencies are installed

### Runtime Errors

**Issue**: Database connection fails
- **Solution**: Verify `DATABASE_URL` is correct
- **Solution**: Check database is accessible from Vercel
- **Solution**: Ensure connection pooling is enabled

**Issue**: AI service errors
- **Solution**: Verify API keys are correct
- **Solution**: Check API rate limits
- **Solution**: Ensure fallback chain is configured

**Issue**: Authentication errors
- **Solution**: Verify `NEXTAUTH_SECRET` is set
- **Solution**: Check `NEXTAUTH_URL` matches deployment URL
- **Solution**: Clear browser cookies and try again

### Performance Issues

**Issue**: Slow page loads
- **Solution**: Enable Vercel Edge Functions
- **Solution**: Implement SWR caching
- **Solution**: Optimize 3D model sizes

**Issue**: High database query times
- **Solution**: Add database indexes
- **Solution**: Use connection pooling
- **Solution**: Optimize Prisma queries

## Monitoring and Maintenance

### Logs

View logs in Vercel dashboard:
- Runtime logs: Shows API errors and warnings
- Build logs: Shows build process and errors
- Edge logs: Shows edge function execution

### Analytics

Monitor performance:
- Page load times
- API response times
- Error rates
- User engagement

### Database Maintenance

Regular tasks:
- Monitor database size
- Optimize slow queries
- Backup database regularly
- Clean up old data

### Updates

Keep dependencies updated:
```bash
npm update
npm audit fix
```

## Scaling Considerations

### Free Tier Limits

Vercel free tier includes:
- 100 GB bandwidth per month
- 100 hours of serverless function execution
- 1 GB storage

### Upgrading

If you exceed free tier limits:
- Upgrade to Vercel Pro ($20/month)
- Optimize API calls to reduce function execution time
- Implement caching to reduce bandwidth

### Database Scaling

- Vercel Postgres free tier: 256 MB storage
- Supabase free tier: 500 MB storage
- Consider upgrading when approaching limits

## Security Checklist

- [ ] All environment variables are set
- [ ] `NEXTAUTH_SECRET` is a strong random value
- [ ] Database credentials are secure
- [ ] API keys are not exposed in client code
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled for AI endpoints
- [ ] File upload validation is working
- [ ] Admin panel requires authentication

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check Next.js documentation: https://nextjs.org/docs
- Check Prisma documentation: https://www.prisma.io/docs
- Review project README.md
- Check GitHub issues

## Rollback

If deployment fails:
1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find the last working deployment
4. Click "Promote to Production"

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

To disable auto-deployment:
1. Go to Project Settings
2. Navigate to Git
3. Disable "Production Branch" or "Preview Branches"
