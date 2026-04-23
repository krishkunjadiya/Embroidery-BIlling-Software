'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadInvoiceSettings, saveInvoiceSettings } from '@/services/invoiceSettingsService';

// Add type declaration for the electron API
declare global {
  interface Window {
    electron: {
      selectFolder: () => Promise<string | null>;
      savePdfToFolder?: (pdfBuffer: Uint8Array, customerName: string, billNumber: string, basePath: string) => Promise<{ success: boolean, filePath: string }>;
    };
  }
}

export default function PDFSettings() {
  const [downloadPath, setDownloadPath] = useState(loadInvoiceSettings().pdfDownloadPath || '');
  const { toast } = useToast();

  const handleSelectFolder = async () => {
    try {
      const selectedPath = await window.electron.selectFolder();
      if (selectedPath) {
        setDownloadPath(selectedPath);
        // Save the settings immediately when a folder is selected
        const currentSettings = loadInvoiceSettings();
        saveInvoiceSettings({
          ...currentSettings,
          pdfDownloadPath: selectedPath,
        });
        toast({
          title: "Folder Selected",
          description: "Download location has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      toast({
        title: "Error",
        description: "Failed to select folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    try {
      const currentSettings = loadInvoiceSettings();
      saveInvoiceSettings({
        ...currentSettings,
        pdfDownloadPath: downloadPath,
      });
      toast({
        title: "Settings Saved",
        description: "PDF download location has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-muted-foreground">PDF Download Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={downloadPath}
            onChange={(e) => setDownloadPath(e.target.value)}
            placeholder="Enter default download path for bill PDFs"
            className="flex-1"
          />
          <Button variant="outline" onClick={handleSelectFolder}>
            <Folder className="h-4 w-4 mr-2" />
            Browse
          </Button>
        </div>
        <Button onClick={handleSave}>Save Download Location</Button>
      </CardContent>
    </Card>
  );
} 