// Test script to validate IPC handlers
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');

console.log('Starting test script');

// Register handler
console.log('Registering select-folder handler');
ipcMain.handle('select-folder', async () => {
  console.log('Handler called!');
  return 'Test path';
});

console.log('IPC handlers registered:', ipcMain.eventNames());

// Create a simple window to test
let win;
app.whenReady().then(() => {
  console.log('App ready, creating window');
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  win.loadFile(path.join(__dirname, 'test.html'));
  win.webContents.openDevTools();
  
  console.log('Window created');
});

// Handle IPC messages
console.log('All event names:', ipcMain.eventNames()); 