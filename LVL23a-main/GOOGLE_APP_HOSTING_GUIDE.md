# LEVEL 23 Legal AI Suite — Google Cloud Hosting, Desktop & PWA Deployment Guide

This guide details all hosting and deployment options for **LEVEL 23 Legal AI Suite**, including:
1. **Google Cloud Run (Recommended for Containerized Hosting)**
2. **Google App Engine (Standard Node.js 20)**
3. **Firebase Hosting (with Cloud Run Proxy & Custom Domain SSL)**
4. **Progressive Web App (PWA) 1-Click Install**
5. **Standalone Desktop Native App & On-Premises Bridge**

---

## 🌐 1. Deploying to Google Cloud Run (Fastest & Most Scalable)

Google Cloud Run scales to zero when idle (no cost) and provides HTTPS, automatic TLS certificates, and global edge routing.

### Step 1: Login & Select Project
```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### Step 2: Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### Step 3: One-Command Build & Deploy
```bash
gcloud run deploy level23-legal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=YOUR_GEMINI_KEY"
```

---

## ⚡ 2. Deploying to Google App Engine

If your firm prefers Google App Engine (`app.yaml` is pre-configured in this repository):

```bash
# 1. Build the frontend and backend bundle
npm run build

# 2. Deploy to Google App Engine
gcloud app deploy app.yaml --project=YOUR_GCP_PROJECT_ID
```

---

## 🔥 3. Deploying via Firebase Hosting + Cloud Run

For instant global CDN caching and automatic custom domain mapping (`practice.yourfirm.com`):

```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Deploy Hosting configuration
firebase deploy --only hosting
```

---

## 📱 4. Installing as a Progressive Web App (PWA)

LEVEL 23 is a fully compliant PWA with offline caching:
- **Google Chrome / Microsoft Edge (Windows & Mac)**: Click the **"Install App"** icon in the URL address bar or use the **"Google App & Hosting"** hub inside the application.
- **Safari on macOS**: Click **File** > **Add to Dock...**.
- **Safari on iOS (iPhone / iPad)**: Tap the **Share** button > select **Add to Home Screen**.
- **Chrome on Android**: Tap the three-dot menu > **Install app**.

---

## 🖥️ 5. Standalone Desktop Native App & On-Premises Bridge

To run Level 23 with local folder sync (`C:\Users\<User>\iiiamadex`) and Google Drive desktop integration:

- **Windows**: Double-click `install-desktop.bat` or run `.\launch-desktop.ps1` in PowerShell.
- **macOS / Linux**: Run `./launch-desktop.sh` in Terminal.
- **Local Bridge Daemon**: Operates on `http://localhost:4321` and continuously monitors case documents.
