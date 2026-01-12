# AILesson Platform - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Preparation
- [x] All tests passing (12+ test suites, 50+ tests)
- [x] Production build verified
- [x] Environment variables documented
- [x] Database schema finalized
- [x] API routes tested
- [x] 3D components optimized

### ✅ Configuration Files
- [x] `vercel.json` configured
- [x] `.gitignore` includes sensitive files
- [x] `next.config.ts` optimized for production
- [x] `prisma/schema.prisma` ready
- [x] Environment variable template created

### ✅ Documentation
- [x] README.md complete
- [x] DEPLOYMENT.md created
- [x] SETUP.md available
- [x] API documentation ready

## Deployment Steps

### Step 1: Verify Local Build ✓

```bash
cd ailesson-platform
npm run build
```

Expected output: Successful Next.js build with no errors.

### Step 2: Push to GitHub

```bash
# Ensure you're in the correct directory
cd "D:\Сергей\cursor\ai-bot-vishka-0.4.1\AILesson remake"

# Check current status
git status

# Add all changes (if any)
git add ailesson-platform/

# Commit changes
git commit -m "Prepare AILesson platform for production deployment"

# Update remote URL to match task specification
git remote set-url origin git@github.com:surgik-gh/AILesson.git

# Or add as new remote if needed
git remote add production git@github.com:surgik-gh/AILesson.git

# Push to GitHub
git push origin main
# Or if using production remote:
git push production main
```

### Step 3: Connect to Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with GitHub account

2. **Import Repository**
   - Click "Import Project"
   - Select `surgik-gh/AILesson` repository
   - Click "Import"

3. **Configure Project** ⚠️ CRITICAL STEP
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `ailesson-platform` ⚠️ **MUST SET THIS!**
   - **Build Command**: `prisma generate && next build` (from vercel.json)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

   **⚠️ IMPORTANT**: You MUST set the Root Directory to `ailesson-platform` to avoid the error:
   ```
   Error: A Serverless Function has an invalid name: "'AILesson remake/ailesson-platform/___next_launcher.cjs'"
   ```
   
   This error occurs because the parent folder name contains a space. Setting the Root Directory tells Vercel to deploy only the `ailesson-platform` folder, avoiding the space in the path.
   
   **How to set Root Directory**:
   - During initial import: Look for "Root Directory" field and enter `ailesson-platform`
   - After import: Go to Project Settings → General → Root Directory → Enter `ailesson-platform` → Save
   
   If you skip this step, deployment will fail!

### Step 4: Configure Environment Variables

Add the following environment variables in Vercel dashboard:

#### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# AI Services
OPENROUTER_API_KEY=<your-openrouter-api-key>
GROQ_API_KEY=<your-groq-api-key>

# Application Configuration
CHAT_COST_PER_MESSAGE=5
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=pdf,png,jpg,jpeg,txt
```

#### How to Set Variables in Vercel

1. Go to Project Settings
2. Click "Environment Variables"
3. Add each variable:
   - Name: Variable name (e.g., `DATABASE_URL`)
   - Value: Variable value
   - Environments: Select Production, Preview, Development
4. Click "Save"

### Step 5: Deploy

1. Click "Deploy" button
2. Wait for build to complete (typically 2-5 minutes)
3. Monitor build logs for any errors

### Step 6: Post-Deployment Verification

#### 6.1 Database Setup

```bash
# Connect to your database and run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
npm run prisma:migrate:deploy
npm run prisma:seed
```

#### 6.2 Test Core Functionality

- [ ] **Homepage loads**: Visit `https://your-app.vercel.app`
- [ ] **Registration works**: Create a new student account
- [ ] **Login works**: Log in with created account
- [ ] **Expert survey**: Complete post-registration survey
- [ ] **Expert generation**: Verify AI generates expert avatar
- [ ] **Dashboard loads**: Check role-specific dashboard
- [ ] **3D rendering**: Verify 3D components render correctly

#### 6.3 Test Student Features

- [ ] Browse available lessons
- [ ] View lesson details
- [ ] Start a quiz
- [ ] Answer questions
- [ ] Complete quiz and see results
- [ ] Check leaderboard
- [ ] View achievements
- [ ] Send chat message to expert
- [ ] View transaction history

#### 6.4 Test Teacher Features

- [ ] Create a new lesson
- [ ] Upload learning material
- [ ] Verify AI generates lesson content
- [ ] Share lesson with students
- [ ] View student progress
- [ ] Export progress report

#### 6.5 Test Admin Features

- [ ] Log in as admin (админ228 / 123456789)
- [ ] Manage users (create, edit, delete)
- [ ] Manage subjects
- [ ] Manage expert avatars
- [ ] View and moderate content
- [ ] Trigger leaderboard reset

#### 6.6 Performance Checks

- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] 3D rendering smooth on desktop
- [ ] Mobile responsive design works
- [ ] No console errors in browser

## Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
```bash
# Solution: Ensure DATABASE_URL is set in Vercel environment variables
# Vercel will run `prisma generate` during build
```

**Error: TypeScript compilation errors**
```bash
# Solution: Run locally to identify errors
npm run build
# Fix errors and push again
```

### Runtime Errors

**Error: Database connection failed**
- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- Ensure connection pooling is enabled
- Test connection: `npx prisma db pull`

**Error: AI service errors**
- Verify `OPENROUTER_API_KEY` is set
- Check API key is valid
- Verify rate limits not exceeded
- Test fallback to Groq

**Error: Authentication not working**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches deployment URL
- Clear browser cookies
- Check session configuration

### Performance Issues

**Slow page loads**
- Enable Vercel Edge Functions
- Implement SWR caching (already done)
- Optimize 3D model sizes
- Use Next.js Image optimization

**High database query times**
- Add database indexes
- Use connection pooling
- Optimize Prisma queries
- Monitor slow query log

## Monitoring

### Vercel Dashboard

Monitor the following:
- **Runtime Logs**: API errors and warnings
- **Build Logs**: Build process and errors
- **Analytics**: Page views, performance metrics
- **Functions**: Serverless function execution times

### Database Monitoring

- Monitor connection count
- Check query performance
- Monitor storage usage
- Set up alerts for errors

## Rollback Procedure

If deployment has critical issues:

1. Go to Vercel Dashboard
2. Navigate to Deployments tab
3. Find the last working deployment
4. Click "..." menu → "Promote to Production"
5. Confirm rollback

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and feature branches

To manually deploy:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Success Criteria

Deployment is successful when:
- ✅ Build completes without errors
- ✅ Application loads at production URL
- ✅ All core features work (auth, lessons, quizzes, chat)
- ✅ Database connection established
- ✅ AI services responding
- ✅ 3D rendering works
- ✅ Mobile responsive
- ✅ No critical errors in logs
- ✅ Performance metrics acceptable

## Next Steps After Deployment

1. **Monitor for 24 hours**: Watch for errors and performance issues
2. **User testing**: Have real users test the platform
3. **Performance optimization**: Based on real-world usage
4. **Set up monitoring**: Configure alerts for errors
5. **Documentation**: Update with production URL
6. **Marketing**: Share with target audience

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Project README**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`

## Deployment Date

- **Prepared**: January 13, 2026
- **Deployed**: [To be filled after deployment]
- **Verified**: [To be filled after verification]
- **Status**: Ready for deployment

---

**Note**: This checklist should be completed in order. Do not skip steps. If any step fails, resolve the issue before proceeding to the next step.
