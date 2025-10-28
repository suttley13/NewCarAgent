# Deployment Guide - Railway + GitHub Actions

This guide shows you how to deploy your Car Agent to Railway.app and set up automated scheduled searches with GitHub Actions.

## Architecture Overview

```
┌─────────────────────┐
│  GitHub Actions     │  Runs scheduled searches
│  (Daily at 9 AM)    │  Downloads/uploads database
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Railway.app       │  Hosts the web server + ChatKit
│   - Express Server  │  Stores the database
│   - ChatKit UI      │  Public URL for ChatKit
│   - SQLite DB       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  OpenAI Platform    │
│  - Agent Builder    │  Your workflow
│  - ChatKit          │  AI processing
└─────────────────────┘
```

## Part 1: Deploy to Railway

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Connect Your Repository

1. Push your code to GitHub first:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/NewCarAgent.git
   git push -u origin main
   ```

2. In Railway, click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will automatically detect it's a Node.js project

### Step 3: Configure Environment Variables

In Railway, go to **Variables** and add:

```bash
# Required
OPENAI_API_KEY=sk-proj-...
OPENAI_AGENT_ID=wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3

# Optional (with defaults)
PORT=3000
DATABASE_PATH=./data/cars.db
SEARCH_QUERY=new sports cars 2024 2025
PRICE_TOLERANCE=15000
MAX_RESULTS=10

# For GitHub Actions sync
RAILWAY_API_TOKEN=generate_a_secure_token_here
```

### Step 4: Add Volume for Database Persistence

1. In Railway, go to your service
2. Click **"Volumes"** tab
3. Add a new volume:
   - **Mount Path:** `/app/data`
   - **Size:** 1GB

This ensures your database persists across deployments!

### Step 5: Deploy

1. Railway will automatically deploy
2. Wait for deployment to complete
3. You'll get a public URL like: `https://your-app.up.railway.app`
4. Visit the URL to see your ChatKit interface!

### Step 6: Configure Agent Builder Workflow

Now update your Agent Builder workflow to use your Railway URL:

1. Go to Agent Builder
2. Edit your workflow actions
3. Change the `save_car_to_database` action URL from:
   ```
   http://localhost:3000/api/cars
   ```
   to:
   ```
   https://your-app.up.railway.app/api/cars
   ```

## Part 2: Set Up GitHub Actions

### Step 1: Configure Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

```bash
OPENAI_API_KEY          # Your OpenAI API key
OPENAI_AGENT_ID         # wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3
RAILWAY_URL             # https://your-app.up.railway.app
RAILWAY_API_TOKEN       # Same token you set in Railway
SEARCH_QUERY            # (Optional) Custom search query
PRICE_TOLERANCE         # (Optional) Price tolerance for comparisons
```

### Step 2: Test the Workflow

1. Go to **Actions** tab in GitHub
2. Find "Scheduled Car Search"
3. Click **"Run workflow"** → **"Run workflow"**
4. Watch it run!

The workflow will:
1. Download the database from Railway
2. Run the car search agent
3. Upload the updated database back to Railway
4. Save the database as an artifact

### Step 3: Verify Scheduled Runs

The workflow is scheduled to run daily at 9 AM UTC. To change the schedule:

Edit `.github/workflows/scheduled-car-search.yml`:

```yaml
on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'

    # Run every Monday at 8 AM
    - cron: '0 8 * * 1'

    # Run daily at midnight
    - cron: '0 0 * * *'
```

[Cron syntax help](https://crontab.guru/)

## How It Works

### Scheduled Search Flow

1. **GitHub Actions triggers** at scheduled time
2. **Downloads database** from Railway (if exists)
3. **Runs CLI agent** (`npm start`)
   - Searches for new sports cars
   - Compares prices
   - Detects duplicates
   - Adds new cars to database
4. **Uploads database** back to Railway
5. **Saves database artifact** in GitHub for backup
6. **Railway serves** updated database to ChatKit UI

### ChatKit Flow

1. **User visits** `https://your-app.up.railway.app`
2. **ChatKit loads** and creates session
3. **User asks** about sports cars
4. **Agent Builder** processes request
5. **Agent calls** `save_car_to_database` action
6. **Railway server** saves car to database
7. **UI auto-refreshes** every 10 seconds to show new cars

## Monitoring

### Railway Logs

View real-time logs in Railway:
```bash
# In Railway dashboard
Project → Service → Logs
```

Look for:
- `✓ Added car via ChatKit: 2024 Porsche 911 - $101200`
- `✓ Database updated from GitHub Actions`
- `Session created successfully`

### GitHub Actions Logs

View workflow runs:
```bash
# In GitHub repository
Actions → Scheduled Car Search → Select run
```

Each run shows:
- Cars found
- Cars added
- Duplicates skipped
- Database size

### Database Artifacts

GitHub Actions saves database backups:
```bash
# In GitHub repository
Actions → Scheduled Car Search → Select run → Artifacts
```

Download `car-database-{run-number}` to inspect offline.

## Troubleshooting

### Railway deployment fails

**Check build logs:**
```bash
Railway → Project → Deployments → Click failed deployment
```

**Common issues:**
- Missing environment variables
- npm install failed → Check package.json
- Port already in use → Railway handles this automatically

**Solution:**
```bash
# Redeploy
Railway → Project → Service → Redeploy
```

### GitHub Actions fails

**Error: "Failed to download database"**
- This is OK on first run (no database exists yet)
- Action will create a new database

**Error: "Unauthorized" when uploading**
- Check `RAILWAY_API_TOKEN` matches in both Railway and GitHub secrets
- Generate a new secure token if needed

**Error: "npm ci" failed**
- Check package.json syntax
- Commit and push package-lock.json

### Database not syncing

**GitHub Actions runs but cars don't appear in Railway:**

1. Check Railway logs for upload confirmation
2. Verify `RAILWAY_API_TOKEN` is correct
3. Test upload manually:
   ```bash
   curl -X POST "https://your-app.up.railway.app/api/database/upload" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "database=@data/cars.db"
   ```

**ChatKit saves cars but they disappear after Railway redeploys:**

- Make sure you added a **Volume** in Railway (Step 4 above)
- Volume mount path should be `/app/data`

### ChatKit not working

**Error: "Session creation failed"**
- Check `OPENAI_API_KEY` in Railway environment variables
- Verify API key has access to Agent Builder

**Error: "Domain verification failed"**
- This warning is OK for development
- For production: Add domain to OpenAI allowlist

## Cost Estimation

### Railway
- **Hobby Plan:** $5/month
  - Includes 500 hours/month
  - 100 GB bandwidth
  - Shared CPU
  - 512 MB RAM

- **Database Volume:** Included in Hobby plan

### GitHub Actions
- **Free tier:** 2,000 minutes/month
- Daily runs: ~3 minutes/run = 90 minutes/month
- **Cost:** FREE

### OpenAI
- **Agent Builder:** Per-request pricing
- **Daily search:** ~$0.10-0.50/day
- **Monthly estimate:** $3-15/month (depending on usage)

**Total: ~$8-20/month**

## Advanced Configuration

### Use PostgreSQL Instead of SQLite

For production at scale, use Railway's PostgreSQL:

1. In Railway, add **PostgreSQL** service
2. Update database code to use `pg` instead of `sqlite3`
3. Connection string automatically available in `DATABASE_URL`

### Add Monitoring

Use Railway's built-in metrics or add:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Grafana** for custom dashboards

### Scale Up

Need more power?

1. Railway → Service → Settings → **Resources**
2. Upgrade to higher tier:
   - Developer: $10/month (2GB RAM, shared CPU)
   - Pro: $20/month (4GB RAM, dedicated CPU)

## Backup Strategy

### Automated Backups

GitHub Actions already saves database artifacts (30-day retention).

### Manual Backup

Download database anytime:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.up.railway.app/api/database/download \
  -o backup-$(date +%Y%m%d).db
```

### Restore from Backup

```bash
curl -X POST "https://your-app.up.railway.app/api/database/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "database=@backup-20250128.db"
```

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Configure GitHub Actions
3. ✅ Test scheduled runs
4. 🎯 Configure Agent Builder workflow
5. 🎯 Add monitoring
6. 🎯 Set up alerts for failures
7. 🎯 Add custom domain (optional)

## Support

- **Railway Docs:** https://docs.railway.app
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **OpenAI Agent Builder:** https://platform.openai.com/docs/guides/agent-builder

---

Your Car Agent is now running 24/7 in the cloud! 🚀
