/**
 * LEVEL 23 LEGAL AI SUITE - NATIVE ELECTRON DESKTOP RUNNER
 * 
 * Packages Level 23 Legal as a standalone Desktop Application for Windows, macOS, and Linux.
 * Integrates directly with on-premises local folders and the Desktop Bridge daemon.
 */

const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let bridgeProcess = null;

// Determine target URL (Local server or Cloud Run instance)
const TARGET_URL = process.env.APP_URL || 'http://localhost:3000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    title: 'LEVEL 23 Legal AI Suite — Desktop Edition',
    backgroundColor: '#060a12',
    icon: path.join(__dirname, 'public', 'icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    frame: true,
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadURL(TARGET_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Level 23 Desktop] Native window rendered successfully.');
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://scholar.google.com') || 
        url.startsWith('https://www.courtlistener.com') ||
        url.startsWith('https://drive.google.com') ||
        url.startsWith('https://law.justia.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start local background bridge daemon if available
function startDesktopBridge() {
  const bridgeScript = path.join(__dirname, 'iiiamadex-desktop-bridge.js');
  try {
    bridgeProcess = spawn('node', [bridgeScript], {
      detached: false,
      stdio: 'ignore'
    });
    console.log('[Level 23 Desktop] Started local filesystem bridge daemon on port 4321');
  } catch (err) {
    console.warn('[Level 23 Desktop] Could not auto-start bridge daemon:', err.message);
  }
}

app.whenReady().then(() => {
  startDesktopBridge();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (bridgeProcess) {
    bridgeProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
