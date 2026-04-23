// ipc-handlers.js
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// Setup all IPC handlers
function setupIpcHandlers(mainWindow) {
  console.log('Setting up IPC handlers with main window:', !!mainWindow);
  
  // Handler for selecting a folder
  ipcMain.handle('select-folder', async () => {
    console.log('select-folder handler invoked');
    
    if (!mainWindow) {
      console.error('Main window not available for dialog');
      throw new Error('Main window not available');
    }
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Download Location'
      });
      
      console.log('Dialog result:', result);
      
      if (result.canceled) {
        return null;
      }
      
      return result.filePaths[0];
    } catch (error) {
      console.error('Error in select-folder handler:', error);
      throw error;
    }
  });
  
  // Handler for saving PDF to customer folder
  ipcMain.handle('save-pdf-to-folder', async (event, { pdfBuffer, customerName, billNumber, basePath }) => {
    console.log(`save-pdf-to-folder handler invoked for customer: ${customerName}, bill: ${billNumber}`);
    
    try {
      if (!basePath) {
        throw new Error('No base path specified for PDF download');
      }

      if (!pdfBuffer || !pdfBuffer.length) {
        throw new Error('Invalid PDF data received');
      }

      // Create customer directory if it doesn't exist
      const safeCustomerName = customerName.replace(/[<>:"/\\|?*]/g, '_').trim();
      if (!safeCustomerName) {
        throw new Error('Invalid customer name');
      }
      
      const customerDir = path.join(basePath, safeCustomerName);
      
      if (!fs.existsSync(customerDir)) {
        console.log(`Creating directory for customer: ${customerDir}`);
        fs.mkdirSync(customerDir, { recursive: true });
      }

      // Create a safe filename
      const safeBillNumber = billNumber.replace(/[<>:"/\\|?*]/g, '_').trim() || 'unknown';
      const safeFileName = `Invoice_${safeBillNumber}.pdf`;
      const filePath = path.join(customerDir, safeFileName);
      
      // Write the PDF file
      fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
      
      console.log(`PDF saved to: ${filePath}`);
      return { success: true, filePath };
    } catch (error) {
      console.error('Error saving PDF to customer folder:', error);
      return { success: false, error: error.message };
    }
  });
  
  console.log('IPC handlers set up, available handlers:', ipcMain.eventNames());
}

function removeIpcHandlers() {
  // Remove all handlers when they're no longer needed
  ipcMain.removeHandler('select-folder');
  ipcMain.removeHandler('save-pdf-to-folder');
  console.log('IPC handlers removed');
}

module.exports = {
  setupIpcHandlers,
  removeIpcHandlers
}; 