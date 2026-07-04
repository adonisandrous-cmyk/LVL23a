/**
 * LEVEL 23 LEGAL DESK - ON-PREMISES DESKTOP CONNECTOR BRIDGE
 * 
 * This is a lightweight Node.js helper proxy utility to securely bridge your local 
 * Windows hard drive folder (C:\Users\Administrator\iiiamadex) with your Cloud Run 
 * Level 23 secure preview portal, AND automatically synchronize with Google Drive.
 * 
 * STEP-BY-STEP RUNNING INSTRUCT FOR ALEX:
 * 1. Open Notepad on your Windows PC.
 * 2. Paste this entire updated script into Notepad.
 * 3. Save as "bridge.js" inside C:\Users\Administrator\iiiamadex
 * 4. Open your Windows Command Prompt (cmd) and paste these THREE commands:
 *      cd C:\Users\Administrator\iiiamadex
 *      npm install express cors
 *      node bridge.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 4321;

// Enable standard CORS to allow secure cross-origin requests from the browser
app.use(cors());
app.use(express.json({ limit: '60mb' }));

// Determine home directory for absolute path matching
const baseDir = path.join(os.homedir(), 'iiiamadex');

// Ensure base dir exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

// Locate Local Google Drive path (Standard Windows Installers)
const possibleDrivePaths = [
  path.join(os.homedir(), 'Google Drive', 'My Drive', 'iiiamadex'),
  path.join(os.homedir(), 'Google Drive', 'iiiamadex'),
  path.join(os.homedir(), 'Google Drive (adonisandrous@gmail.com)', 'My Drive', 'iiiamadex'),
  // If no email specific or root path, map to a folder inside Google Drive desktop mount G:\
  'G:\\My Drive\\iiiamadex',
  'G:\\iiiamadex'
];

let activeGoogleDrivePath = null;

function scanGoogleDrivePath() {
  for (const drivePath of possibleDrivePaths) {
    try {
      // Check if parent directory exists (e.g., Google Drive root folder)
      const parentDir = path.dirname(drivePath);
      if (fs.existsSync(parentDir)) {
        if (!fs.existsSync(drivePath)) {
          fs.mkdirSync(drivePath, { recursive: true });
        }
        activeGoogleDrivePath = drivePath;
        console.log(`[iiiamadex Sentry] ☁️ Found Google Drive desktop mount point at: ${activeGoogleDrivePath}`);
        return activeGoogleDrivePath;
      }
    } catch (e) {
      // Suppress individual detection errors
    }
  }
  return null;
}

// Run initial scan
scanGoogleDrivePath();

// Bidirectional Synchronizer
function runSync() {
  const gDrive = activeGoogleDrivePath || scanGoogleDrivePath();
  if (!gDrive) {
    console.log(`[iiiamadex Sentry] ℹ️ Google Drive desktop folder not yet active. Using local standalone mode.`);
    return { synced: false, reason: 'Google Drive App is not running or folder not mounted yet.' };
  }

  try {
    const localFiles = fs.readdirSync(baseDir);
    const driveFiles = fs.readdirSync(gDrive);

    let syncCount = 0;

    // 1. Copy local to Google Drive (if newer or missing)
    for (const f of localFiles) {
      const localFilePath = path.join(baseDir, f);
      const driveFilePath = path.join(gDrive, f);
      
      const localStat = fs.statSync(localFilePath);
      if (localStat.isDirectory()) continue;

      let shouldCopy = false;
      if (!fs.existsSync(driveFilePath)) {
        shouldCopy = true;
      } else {
        const driveStat = fs.statSync(driveFilePath);
        if (localStat.mtimeMs > driveStat.mtimeMs) {
          shouldCopy = true;
        }
      }

      if (shouldCopy) {
        fs.copyFileSync(localFilePath, driveFilePath);
        syncCount++;
        console.log(`[iiiamadex Sentry] ⬆️ Uploaded to Google Drive: ${f}`);
      }
    }

    // 2. Copy Google Drive to local (if newer or missing)
    for (const f of driveFiles) {
      const localFilePath = path.join(baseDir, f);
      const driveFilePath = path.join(gDrive, f);

      const driveStat = fs.statSync(driveFilePath);
      if (driveStat.isDirectory()) continue;

      let shouldCopy = false;
      if (!fs.existsSync(localFilePath)) {
        shouldCopy = true;
      } else {
        const localStat = fs.statSync(localFilePath);
        if (driveStat.mtimeMs > localStat.mtimeMs) {
          shouldCopy = true;
        }
      }

      if (shouldCopy) {
        fs.copyFileSync(driveFilePath, localFilePath);
        syncCount++;
        console.log(`[iiiamadex Sentry] ⬇️ Downloaded and synced to local disk: ${f}`);
      }
    }

    if (syncCount > 0) {
      console.log(`[iiiamadex Sentry] ✅ Completed bidirectional sync cycle. Synchronized ${syncCount} document profiles.`);
    }
    return { synced: true, drivePath: gDrive, filesSyncedCount: syncCount };
  } catch (error) {
    console.error(`[iiiamadex Sentry] ⚠️ Synchronization cycle warning:`, error.message);
    return { synced: false, error: error.message };
  }
}

// Endpoint 1: List all active files inside C:\Users\Administrator\iiiamadex (with Auto Google Drive Sync triggered on view)
app.get('/api/local-files', (req, res) => {
  try {
    const syncStatus = runSync();
    const files = fs.readdirSync(baseDir);
    console.log(`[iiiamadex Sentry] 🔍 Loaded ${files.length} legal documents.`);
    res.json({
      success: true,
      folder: baseDir,
      files: files,
      syncStatus: syncStatus
    });
  } catch (err) {
    console.error(`[iiiamadex Error] Directory listing failed:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint 2: Read raw file contents safely
app.get('/api/local-file', (req, res) => {
  const fileName = req.query.name;
  if (!fileName) return res.status(400).json({ error: 'Missing name parameter' });
  try {
    const filePath = path.join(baseDir, fileName);
    if (!filePath.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Directory traversal is forbidden.' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint 3: Store/Save generated litigation briefs directly onto local hard drive and sync immediately
app.post('/api/local-write', (req, res) => {
  const { fileName, content } = req.body;
  if (!fileName || !content) return res.status(400).json({ error: 'Missing fileName or content.' });
  try {
    const filePath = path.join(baseDir, fileName);
    if (!filePath.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Directory traversal is forbidden.' });
    }
    
    // Write locally
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[iiiamadex Sentry] 💾 Successfully wrote brief locally: ${fileName}`);
    
    // Trigger immediate upload sync
    const syncResult = runSync();
    
    res.json({ 
      success: true, 
      filePath,
      syncResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`🚀 Level 23 Desktop Bridge is Active with Auto Google Drive Sync!`);
  console.log(`📂 Listening locally on: http://localhost:${PORT}`);
  console.log(`🏠 Client Workspace Folder: ${baseDir}`);
  console.log(`☁️ Google Drive Target Folder: ${activeGoogleDrivePath || 'Scanning desktop...'}`);
  console.log(`================================================================`);
});
