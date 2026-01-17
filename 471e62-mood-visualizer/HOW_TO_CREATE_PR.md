# How to Create PR - Simple Steps

## Your Situation

- **Task:** mood-visualizer (2YTQ0A)
- **Branch:** `471e62-mood-visualizer` (already exists)
- **Repository:** `eaglepoint-ai/bd_dataset_001`
- **You don't have push access** - that's normal

## Solution: Fork and Create PR

### Step 1: Fork the Repository

1. Go to: https://github.com/eaglepoint-ai/bd_dataset_001
2. Click **"Fork"** button (top right corner)
3. This creates a copy in your GitHub account

### Step 2: Push Your Code to Your Fork

Open terminal in your project folder and run:

```bash
# Add your fork as a remote (replace YOUR_USERNAME with your GitHub username)
git remote add fork https://github.com/YOUR_USERNAME/bd_dataset_001.git

# Push your branch to your fork
git push fork 471e62-mood-visualizer
```

**Example:** If your username is `biruk-1`, the command would be:
```bash
git remote add fork https://github.com/biruk-1/bd_dataset_001.git
git push fork 471e62-mood-visualizer
```

### Step 3: Create Pull Request

1. Go to your fork: `https://github.com/YOUR_USERNAME/bd_dataset_001`
2. You'll see a yellow banner saying: **"471e62-mood-visualizer had recent pushes"**
3. Click **"Compare & pull request"** button
4. If you don't see the banner:
   - Click **"Pull requests"** tab
   - Click **"New pull request"**
   - Base: `eaglepoint-ai/bd_dataset_001` → `471e62-mood-visualizer`
   - Compare: `YOUR_USERNAME/bd_dataset_001` → `471e62-mood-visualizer`

### Step 4: Fill PR Details

**Title:**
```
feat: Complete MoodMorph implementation
```

**Description:**
```
Complete MoodMorph app implementation.

- All 4 requirements implemented
- 66 tests passing
- Docker support included
- See README.md for setup instructions
```

### Step 5: Create and Send Link

1. Click **"Create pull request"**
2. Copy the PR URL (looks like: `https://github.com/eaglepoint-ai/bd_dataset_001/pull/XXX`)
3. **Send this link to your task manager/owner**
4. They will review and merge it

## Quick Checklist

- [ ] Forked the repository
- [ ] Added fork as remote
- [ ] Pushed branch to fork
- [ ] Created PR
- [ ] Sent PR link to owner

## If You Get Stuck

**Can't push?** Make sure you're authenticated:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Need help?** The PR link is what matters - once you have it, send it to the owner.
