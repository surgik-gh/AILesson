# Daily Leaderboard Reset

The AILesson platform includes a daily leaderboard reset feature that:
1. Awards +25 wisdom coins to the top-ranked student
2. Resets all student leaderboard statistics (score, quiz count, correct/total answers)

## Implementation Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel Deployment)

1. Create a `vercel.json` file in the project root:

```json
{
  "crons": [
    {
      "path": "/api/leaderboard/reset",
      "schedule": "0 0 * * *"
    }
  ]
}
```

2. Set the `CRON_SECRET` environment variable in Vercel:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `CRON_SECRET` with a secure random value

3. The cron job will automatically call the reset endpoint daily at midnight UTC.

### Option 2: External Cron Service (e.g., cron-job.org, EasyCron)

1. Set up a cron job to make a POST request to:
   ```
   https://your-domain.com/api/leaderboard/reset
   ```

2. Include the authorization header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

3. Schedule: Daily at your preferred time (e.g., midnight)

### Option 3: Manual Reset (For Testing)

You can manually trigger the reset using the server action:

```typescript
import { resetDailyLeaderboard } from '@/app/actions/leaderboard';

// Call this function to reset the leaderboard
const result = await resetDailyLeaderboard();
console.log(result);
```

## API Endpoint

**POST** `/api/leaderboard/reset`

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard reset successfully",
  "leader": {
    "name": "John Doe",
    "score": 150,
    "coinsAwarded": 25
  },
  "studentsReset": 42
}
```

## Environment Variables

Add to your `.env` file:

```env
CRON_SECRET=your-secure-random-token-here
```

Generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing

To test the reset functionality:

1. Create some test students with leaderboard entries
2. Call the reset endpoint or server action
3. Verify:
   - Top student received +25 wisdom coins
   - All student leaderboard entries are reset to 0
   - TokenTransaction record was created for the leader

## Monitoring

Check the Vercel logs or your server logs to ensure the cron job runs successfully:
- Look for "Leaderboard reset successfully" messages
- Monitor for any errors in the reset process
- Verify students are receiving their rewards

## Troubleshooting

**Cron job not running:**
- Verify `vercel.json` is in the project root
- Check that the cron schedule syntax is correct
- Ensure the project is deployed to Vercel

**Authorization errors:**
- Verify `CRON_SECRET` is set in environment variables
- Check that the authorization header matches the secret

**No students reset:**
- Verify there are students with leaderboard entries
- Check database connection
- Review server logs for errors
