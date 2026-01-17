# Guide to Push Code and Create Pull Request

## Step 1: Add your fork as a remote

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:

```powershell
git remote add fork https://github.com/YOUR_GITHUB_USERNAME/bd_dataset_001.git
```

Or if you want to update the origin to point to your fork:

```powershell
git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/bd_dataset_001.git
```

## Step 2: Stage your changes

```powershell
git add .
```

Or selectively add files (excluding __pycache__):

```powershell
git add Dockerfile README.md docker-compose.yml evaluation/evaluation.py requirements.txt
git add IMPLEMENTATION_SUMMARY.md TESTING_GUIDE.md
git add evaluation/2026-01-17/ evaluation/reports/
git add repository_after/solution.py repository_before/solution.py
git add tests/test_solution.py
```

## Step 3: Commit your changes

```powershell
git commit -m "Add solution and tests for separate squares problem"
```

## Step 4: Push to your fork

If you added a 'fork' remote:
```powershell
git push fork 830687-separate-squares-problem
```

If you updated origin:
```powershell
git push origin 830687-separate-squares-problem
```

## Step 5: Create Pull Request

After pushing, go to:
- https://github.com/YOUR_GITHUB_USERNAME/bd_dataset_001
- You'll see a banner suggesting to create a PR, or
- Go to: https://github.com/eaglepoint-ai/bd_dataset_001/compare
- Select your fork and branch
- Click "Create Pull Request"
