const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  selectFolder: async () => {
    console.log('selectFolder called from renderer');
    try {
      console.log('Invoking select-folder...');
      const result = await ipcRenderer.invoke('select-folder');
      console.log('select-folder result:', result);
      return result;
    } catch (error) {
      console.error('Error invoking select-folder:', error);
      throw error;
    }
  },
  
  savePdfToFolder: async (pdfBuffer, customerName, billNumber, basePath) => {
    console.log('savePdfToFolder called from renderer');
    try {
      console.log('Invoking save-pdf-to-folder...');
      const result = await ipcRenderer.invoke('save-pdf-to-folder', {
        pdfBuffer,
        customerName,
        billNumber,
        basePath
      });
      console.log('save-pdf-to-folder result:', result);
      return result;
    } catch (error) {
      console.error('Error invoking save-pdf-to-folder:', error);
      throw error;
    }
  },
  // General purpose IPC methods
    send: (channel, data) => {
    const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
    const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
  // Utility methods
    ping: () => 'pong',
    versions: {
      node: () => process.versions.node,
      chrome: () => process.versions.chrome,
      electron: () => process.versions.electron
    }
});

console.log('Preload script completed, API exposed'); 