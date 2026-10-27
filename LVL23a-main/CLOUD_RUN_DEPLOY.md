# Deploying Level 23 Legal to Google Cloud Run

This repository is pre-configured and ready for seamless deployment to **Google Cloud Run**.

---

## 🚀 Quick Deployment Options

### Option 1: One-Click Windows Deployment Script (`deploy-cloudrun.bat`)

Double-click `deploy-cloudrun.bat` (or run it from CMD/PowerShell):

```bat
deploy-cloudrun.bat
```

This automated script:
1. Verifies the `gcloud` CLI installation and authenticates if needed.
2. Prompts or confirms your Google Cloud Project ID.
3. Automatically enables required APIs (`run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`).
4. Builds your container and deploys directly to Cloud Run.
5. Automatically fetches your live HTTPS URL and opens the application in your default browser.

---

### Option 2: Direct Deployment using Google Cloud CLI (Terminal / Cloud Shell)

Run the following commands in your terminal or Google Cloud Shell:

```bash
# 1. Authenticate with Google Cloud (if not using Cloud Shell)
gcloud auth login

# 2. Set your active Google Cloud Project ID
gcloud config set project YOUR_GCP_PROJECT_ID

# 3. Enable required Cloud Run & Artifact Registry services
gcloud services enable run.googleapis.com artifactregistry.googleapis.com builds.googleapis.com

# 4. Deploy directly from source code to Cloud Run
gcloud run deploy level23-legal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="NODE_ENV=production,OPENROUTER_API_KEY=your_openrouter_key_here"
```

---

### Option 2: Continuous Deployment via GitHub Actions or Cloud Build

1. Push this codebase to your **GitHub** repository.
2. In Google Cloud Console:
   - Go to **Cloud Run** > **Create Service**.
   - Select **"Continuously deploy new revisions from a source repository"**.
   - Connect your GitHub repository.
   - Set Container Port to `3000`.
   - Set Environment Variables:
     - `OPENROUTER_API_KEY`: *(Optional if using OpenRouter)*
     - `GEMINI_API_KEY`: *(Optional if using Google Gemini)*

---

## 🔐 Environment Variables Summary

| Variable Name | Required? | Description |
|---|---|---|
| `PORT` | Optional | Defaults to `3000` (matches container port `3000`) |
| `NODE_ENV` | Yes | Set to `production` |
| `OPENROUTER_API_KEY` | Optional | Enables OpenRouter models (`claude-3.7-sonnet`, `llama-3.3-70b`, `free`) |
| `GEMINI_API_KEY` | Optional | Enables Google Gemini models (`gemini-3.6-flash`, `gemini-3.1-pro`) |

---

## ⚙️ How Built-in Cloud Run Features Work
- **Unified Port (3000)**: Container listens on port `3000` for both Google AI Studio container ingress and Cloud Run services (`--port 3000`).
- **Single CJS Bundle**: `npm run build` bundles the server into `dist/server.cjs` via `esbuild` for ultra-fast container startup (~1 second cold starts).
- **Static Asset Fallback**: Serves pre-built Vite frontend assets out of `dist/`.
