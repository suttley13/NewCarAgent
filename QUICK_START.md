# Quick Start Guide

## 🚀 Deploy to Railway in 10 Minutes

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create NewCarAgent --public --source=. --remote=origin --push
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `NewCarAgent`
4. Wait for deployment

### 3. Add Environment Variables
In Railway → Variables:
```
OPENAI_API_KEY=sk-proj-...
OPENAI_AGENT_ID=wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3
RAILWAY_API_TOKEN=choose_a_secure_token_here
```

### 4. Add Volume
Railway → Volumes → Add Volume:
- Mount Path: `/app/data`
- Size: 1GB

### 5. Get Your URL
Railway will give you a URL like: `https://your-app.up.railway.app`

Visit it to see your ChatKit interface!

## ⏰ Set Up Scheduled Runs

### 1. Configure GitHub Secrets
GitHub repo → Settings → Secrets → Actions:
```
OPENAI_API_KEY=sk-proj-...
OPENAI_AGENT_ID=wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3
RAILWAY_URL=https://your-app.up.railway.app
RAILWAY_API_TOKEN=same_token_from_step_3_above
```

### 2. Test the Workflow
GitHub → Actions → "Scheduled Car Search" → "Run workflow"

### 3. Done!
The agent will now run automatically every day at 9 AM UTC.

## 📋 What You Get

- ✅ Web interface at your Railway URL
- ✅ ChatKit for conversations
- ✅ Database showing all cars
- ✅ Automated daily searches
- ✅ Duplicate detection
- ✅ Price comparisons

## 📚 Detailed Documentation

- **Full deployment guide:** See `DEPLOYMENT.md`
- **Workflow setup:** See `WORKFLOW_SETUP.md`
- **ChatKit setup:** See `CHATKIT_SETUP.md`

## 🎯 Next Steps

1. Configure Agent Builder workflow (see `WORKFLOW_SETUP.md`)
2. Customize search query in GitHub secrets
3. Adjust schedule in `.github/workflows/scheduled-car-search.yml`

That's it! Your Car Agent is now running 24/7 in the cloud! 🎉
