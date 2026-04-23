const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { setupIpcHandlers, removeIpcHandlers } = require('./ipc-handlers');

let mainWindow;
let retryCount = 0;
const MAX_RETRIES = 3;

function createWindow() {
  console.log('Creating main window');
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev
    }
  });

  // Setup IPC handlers with the created window
  setupIpcHandlers(mainWindow);

  // Load your web app
  if (isDev) {
    // In development mode, wait for the Next.js server to start
    const loadApp = () => {
      if (retryCount >= MAX_RETRIES) {
        console.error('Max retries reached, loading error page');
        mainWindow.loadFile(path.join(__dirname, 'error.html')).catch(console.error);
        return;
      }

      mainWindow.loadURL('http://localhost:9002/dashboard').catch(err => {
        console.error('Failed to load URL:', err);
        retryCount++;
        console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);
        setTimeout(loadApp, 2000);
      });
    };

    // Initial load attempt after a delay
    setTimeout(loadApp, 2000);
    
      // Open the DevTools.
      mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built HTML file
    mainWindow.loadFile(path.join(__dirname, '../out/index.html')).catch(err => {
      console.error('Failed to load file:', err);
      // Show error in window
      mainWindow.loadFile(path.join(__dirname, 'error.html')).catch(console.error);
    });
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    removeIpcHandlers();  // Clean up IPC handlers when window closes
    mainWindow = null;
  });

  // Add error handling for page load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying after load failure... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:9002/dashboard').catch(console.error);
      }, 2000);
    } else {
      // Show error in window after max retries
    mainWindow.loadFile(path.join(__dirname, 'error.html')).catch(console.error);
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow).catch(console.error);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 