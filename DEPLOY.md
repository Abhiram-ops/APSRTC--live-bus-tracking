# ☁️ Deployment Guide (Render.com)

Deploying your app to the cloud is free and easy with Render. Follow these steps to get a public URL for your project.

## Step 1: Push Code to GitHub
Ensure you have run the following commands in your terminal (I already did the commit for you, just need to push):
```bash
git push -u origin main
```
*Verify that your repository on GitHub has the latest files including `Backend/Procfile` and `runtime.txt`.*

## Step 2: Create Account on Render
1.  Go to [dashboard.render.com/register](https://dashboard.render.com/register).
2.  Sign up using your **GitHub** account (this makes linking easy).

## Step 3: Create a Web Service
1.  Click **"New +"** and select **"Web Service"**.
2.  In the list "Connect a repository", find `apsrtc-live-track` (or whatever you named your repo) and click **Connect**.

## Step 4: Configure Settings
Fill in the form with these details:
-   **Name**: `apsrtc-vizag` (or any unique name)
-   **Region**: Singapore (or nearest to you)
-   **Branch**: `main`
-   **Root Directory**: `Backend` (Important!)
-   **Runtime**: `Python 3`
-   **Build Command**: `pip install -r ../requirements.txt`
-   **Start Command**: `gunicorn backend:app`
-   **Instance Type**: `Free`

## Step 5: Deploy
1.  Click **"Create Web Service"**.
2.  Wait for the deployment logs to finish (it might take 2-3 minutes).
3.  Once done, you will see a URL like `https://apsrtc-vizag.onrender.com`.

## Step 6: Initialize Database (One-time)
Since Render is a new environment, the database is empty. You need to run the init script manually once.
1.  In the Render Dashboard, go to your service.
2.  Click on the **"Shell"** tab (left sidebar).
3.  Type `python init_db.py` and hit Enter.
4.  You should see `[OK] Database created successfully!`.

🎉 **Done! Your app is now live.** Share the link with anyone!
