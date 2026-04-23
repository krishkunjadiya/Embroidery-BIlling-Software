import { SavedBill } from '@/types/bill';
import { FullBillData } from '@/types/billing';
import { loadInvoiceSettings } from './invoiceSettingsService';
import { pdf } from '@react-pdf/renderer';
import PdfInvoice from '@/components/pdf/PdfInvoice';
import { createElement } from 'react';
import { Document } from '@react-pdf/renderer';
import { calculateBillAmounts } from '@/lib/billing-utils';

declare global {
  interface Window {
    electron: {
      selectFolder: () => Promise<string | null>;
      savePdfToFolder?: (pdfBuffer: Uint8Array, customerName: string, billNumber: string, basePath: string) => Promise<{ success: boolean, filePath: string }>;
    };
  }
}

export async function exportBillWithReactPdf(bill: SavedBill | FullBillData): Promise<boolean> {
  try {
    if (!bill) throw new Error('No bill data provided for PDF export');

    const settings = loadInvoiceSettings();
    const basePath = settings.pdfDownloadPath;
    
    if (!basePath) {
      console.error('No PDF download path configured in settings');
      return false;
    }

    if (typeof window === 'undefined' || !window.electron?.savePdfToFolder) {
      console.error('Electron API for PDF saving is not available');
      return false;
    }

    const customerName = bill.billTo?.name || 'Unknown Customer';
    const billNumber = bill.invoiceDetails?.invoiceNumber || 'unknown';
    
    // Ensure we have calculated amounts
    let fullBillData: FullBillData;
    
    if (!bill.calculatedAmounts) {
      console.log('Recalculating bill amounts for PDF export');
      
      // Process items to ensure they have proper amounts
      const itemsWithAmount = (bill.items || []).map(item => {
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        return {
          ...item,
          quantity,
          rate,
          amount: quantity * rate,
        };
      });
      
      // Create proper data structure for calculation
      const formDataForCalculation = {
        ...bill,
        items: itemsWithAmount,
        discountPercentage: Number(bill.discountPercentage) || 0,
        gstSettings: {
          cgstRate: Number(bill.gstSettings?.cgstRate) || 0,
          sgstRate: Number(bill.gstSettings?.sgstRate) || 0,
        },
        applyDiscountToTaxableAmount: bill.applyDiscountToTaxableAmount ?? true,
      };
      
      // Calculate bill amounts
      const calculatedAmounts = calculateBillAmounts(formDataForCalculation);
      
      // Create full bill data with calculated amounts
      fullBillData = {
        ...bill,
        items: itemsWithAmount,
        calculatedAmounts,
        invoiceDisplaySettings: bill.invoiceDisplaySettings || settings,
      } as FullBillData;
    } else {
      fullBillData = bill as FullBillData;
    }
    
    console.log('PDF export with calculated amounts:', fullBillData.calculatedAmounts);
    
    const element = createElement(Document, {}, createElement(PdfInvoice, { data: fullBillData }));
    const pdfBlob = await pdf(element).toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = new Uint8Array(arrayBuffer);
    
    const result = await window.electron.savePdfToFolder(
      pdfBuffer, 
      customerName, 
      billNumber, 
      basePath
    );
    
    console.log('PDF saved:', result);
    return result.success;
  } catch (error) {
    console.error('Error exporting bill to PDF with React-PDF:', error);
    return false;
  }
}

export async function previewBillAsReactPdf(bill: FullBillData): Promise<string> {
  try {
    // Make sure we have calculated amounts
    if (!bill.calculatedAmounts) {
      console.log('Recalculating bill amounts for preview');
      bill = {
        ...bill,
        calculatedAmounts: calculateBillAmounts(bill),
      };
    }
    
    const element = createElement(Document, {}, createElement(PdfInvoice, { data: bill }));
    const blob = await pdf(element).toBlob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
  }
} 