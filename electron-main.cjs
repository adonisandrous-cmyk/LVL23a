/**
 * LEVEL 23 LEGAL AI SUITE - NATIVE ELECTRON WINDOWS/MACOS/LINUX DESKTOP RUNNER
 * 
 * Packages Level 23 Legal as a standalone Desktop Application.
 * Integrates directly with on-premises local folders, Ollama Local AI,
 * and the Desktop Bridge daemon.
 */

const electronModule = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// If executed via vanilla 'node electron-main.cjs', electronModule is the binary path string!
if (typeof electronModule === 'string') {
  const electronBinary = electronModule;
  const child = spawn(electronBinary, [__filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env
  });
  child.on('close', (code) => process.exit(code || 0));
  return;
}

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = electronModule;

let mainWindow = null;
let bridgeProcess = null;
let serverProcess = null;

// Determine target URL (Local server or Cloud Run instance)
const TARGET_PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.APP_URL || `http://localhost:${TARGET_PORT}`;

// Helper to check if local server is listening
function checkServerReady(port, callback) {
  const req = http.get(`http://localhost:${port}/api/system/full-diagnostics`, (res) => {
    callback(true);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(1200, () => {
    req.destroy();
    callback(false);
  });
}

// Auto-spawn backend server if running in local standalone desktop mode
function ensureLocalServerRunning(callback) {
  checkServerReady(TARGET_PORT, (ready) => {
    if (ready) {
      console.log(`[Level 23 Desktop] Target server already running on port ${TARGET_PORT}.`);
      return callback();
    }

    console.log(`[Level 23 Desktop] Starting local application server on port ${TARGET_PORT}...`);
    const isWindows = process.platform === 'win32';
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';
    
    serverProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: path.resolve(__dirname),
      shell: true,
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server]: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Err]: ${data}`);
    });

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      checkServerReady(TARGET_PORT, (isUp) => {
        if (isUp || attempts >= 25) {
          clearInterval(interval);
          callback();
        }
      });
    }, 1000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1080,
    minHeight: 720,
    title: 'LEVEL 23 Legal AI Suite — Desktop Workstation (Windows Edition)',
    backgroundColor: '#060a12',
    icon: path.join(__dirname, 'public', 'icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    show: false
  });

  // Windows Desktop Application Menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Local Case Folder (iiiamadex)',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const defaultPath = path.join(process.env.USERPROFILE || process.env.HOME || '.', 'iiiamadex');
            shell.openPath(defaultPath);
          }
        },
        {
          label: 'Export Backup / Archive',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('trigger-export-backup');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit Desktop Suite',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Legal Tools',
      submenu: [
        {
          label: 'Open California Form Harvester (FL-141 / FL-120)',
          click: () => {
            mainWindow.loadURL(`${TARGET_URL}#forms`);
          }
        },
        {
          label: 'Open Desktop Workstation Tab',
          click: () => {
            mainWindow.loadURL(`${TARGET_URL}#desktop`);
          }
        },
        {
          label: 'Launch Local Ollama Co-Pilot',
          click: () => {
            shell.openExternal('http://localhost:11434');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Online Legal Documentation',
          click: () => shell.openExternal('https://www.courts.ca.gov/forms.htm')
        },
        {
          label: 'Verify Ollama AI Local Status',
          click: () => {
            http.get('http://localhost:11434/api/tags', (res) => {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Ollama Status',
                message: 'Local Ollama AI daemon is active and responsive on http://localhost:11434!'
              });
            }).on('error', () => {
              dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'Ollama Offline',
                message: 'Ollama is currently offline on port 11434. The suite will automatically use free-tier cloud backup models (Gemma 2 / Llama 3).'
              });
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load Main App (Targeting http://localhost:3000)
  mainWindow.loadURL(TARGET_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Level 23 Desktop] Native Windows window rendered successfully.');
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://scholar.google.com') || 
        url.startsWith('https://www.courtlistener.com') ||
        url.startsWith('https://drive.google.com') ||
        url.startsWith('https://law.justia.com') ||
        url.startsWith('https://ollama.com')) {
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
  ensureLocalServerRunning(() => {
    startDesktopBridge();
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (bridgeProcess) {
    try { bridgeProcess.kill(); } catch (e) {}
  }
  if (serverProcess) {
    try { serverProcess.kill(); } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
