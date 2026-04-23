// restart-app.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Restarting Electron app...');

// Get current directory
const currentDir = __dirname;
const rootDir = path.resolve(currentDir, '..');

try {
  // Stop any running instances
  console.log('Stopping any running instances...');
  
  // Build and start
  console.log('Building and starting...');
  if (process.platform === 'win32') {
    // Windows commands
    execSync('npm run electron:dev', { 
      cwd: rootDir,
      stdio: 'inherit'
    });
  } else {
    // Unix commands
    execSync('npm run electron:dev', { 
      cwd: rootDir,
      stdio: 'inherit'
    });
  }
  
  console.log('App restarted successfully!');
} catch (error) {
  console.error('Error restarting app:', error);
} 