'use client';

import type { SavedBill, PaymentDetails } from '@/types/bill';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import type { Customer } from '@/types/customer'; 
import { loadCustomers } from '@/services/customer'; 
import { loadInvoiceSettings, saveInvoiceSettings } from '@/services/invoiceSettingsService';

const LOCAL_STORAGE_KEY_BILLS = 'embroideryBillingSavedBills';

// For storage purposes - dates as strings
interface StorableBill extends Omit<SavedBill, 'savedAt' | 'invoiceDetails' | 'paymentDetails'> {
  savedAt: string;
  invoiceDetails: {
    date: string | null;
    invoiceNumber: string;
  };
  paymentDetails?: {
    method: 'cash' | 'online' | 'cheque';
    paymentDate: string;
    [key: string]: any;
  };
}

export const saveBill = (billData: SavedBill): void => {
  if (typeof window === 'undefined') return;
  try {
    const existingBills = loadBills();
    const billIndex = existingBills.findIndex(b => b.id === billData.id);

    // Create a serializable version of the bill
    const billToSave: StorableBill = {
      ...billData,
      invoiceDetails: {
        ...billData.invoiceDetails,
        // Ensure date is properly serialized
        date: billData.invoiceDetails.date ? billData.invoiceDetails.date.toISOString() : null,
      },
      // Ensure date is properly serialized
      savedAt: billData.savedAt ? billData.savedAt.toISOString() : new Date().toISOString(),
      paymentStatus: billData.paymentStatus || 'pending',
      paymentDetails: billData.paymentDetails ? {
        ...billData.paymentDetails,
        // Ensure dates in payment details are properly serialized
        paymentDate: billData.paymentDetails.paymentDate.toISOString(),
        ...(billData.paymentDetails.method === 'cheque' && billData.paymentDetails.chequeDate && {
          chequeDate: billData.paymentDetails.chequeDate.toISOString()
        })
      } : undefined,
      invoiceDisplaySettings: billData.invoiceDisplaySettings || loadInvoiceSettings(),
    };

    if (billIndex > -1) {
      // Replace existing bill with new data
      const updatedBills = [...existingBills];
      updatedBills[billIndex] = billToSave as unknown as SavedBill; 
      localStorage.setItem(LOCAL_STORAGE_KEY_BILLS, JSON.stringify(updatedBills));
    } else {
      // Add new bill
      const newBills = [...existingBills, billToSave as unknown as SavedBill];
      localStorage.setItem(LOCAL_STORAGE_KEY_BILLS, JSON.stringify(newBills));
    }

    const currentSettings = loadInvoiceSettings();
    if (currentSettings.autoIncrementInvoiceNumber && billData.invoiceDetails.invoiceNumber) {
        const num = Number(billData.invoiceDetails.invoiceNumber);
        if (!isNaN(num) && currentSettings.nextInvoiceNumber !== null && num >= currentSettings.nextInvoiceNumber) {
             saveInvoiceSettings({ ...currentSettings, nextInvoiceNumber: num + 1 });
        } else if (currentSettings.nextInvoiceNumber === null && !isNaN(num)) {
             saveInvoiceSettings({ ...currentSettings, nextInvoiceNumber: num + 1 });
        }
    }
  } catch (error) {
    console.error("Failed to save bill to localStorage:", error);
  }
};

export const loadBills = (): SavedBill[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_BILLS);
    const currentDisplaySettings = loadInvoiceSettings();

    if (storedData) {
      const storedBills = JSON.parse(storedData) as StorableBill[];
      
      return storedBills.map(storedBill => {
        // Convert string dates back to Date objects
        const bill: SavedBill = {
          ...storedBill,
        invoiceDetails: {
            ...storedBill.invoiceDetails,
            date: storedBill.invoiceDetails.date ? new Date(storedBill.invoiceDetails.date) : null,
        },
          savedAt: storedBill.savedAt ? new Date(storedBill.savedAt) : new Date(),
          paymentStatus: storedBill.paymentStatus || 'pending',
          // Process payment details if they exist
          paymentDetails: storedBill.paymentDetails ? {
            ...storedBill.paymentDetails,
            paymentDate: new Date(storedBill.paymentDetails.paymentDate),
            ...(storedBill.paymentDetails.method === 'cheque' && storedBill.paymentDetails.chequeDate && { 
              chequeDate: new Date(storedBill.paymentDetails.chequeDate) 
            })
        } : undefined,
          invoiceDisplaySettings: storedBill.invoiceDisplaySettings || currentDisplaySettings,
        };
        return bill;
      }).sort((a, b) => {
        const dateA = a.invoiceDetails.date ? new Date(a.invoiceDetails.date).getTime() : 0;
        const dateB = b.invoiceDetails.date ? new Date(b.invoiceDetails.date).getTime() : 0;
        return dateB - dateA;
    });
    }
    return [];
  } catch (error) {
    console.error("Failed to load bills from localStorage:", error);
    return [];
  }
};

export const loadBillById = (billId: string): SavedBill | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const bills = loadBills();
  return bills.find(b => b.id === billId);
};

export const deleteBill = (billId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    let existingBills = loadBills();
    existingBills = existingBills.filter(b => b.id !== billId);
    localStorage.setItem(LOCAL_STORAGE_KEY_BILLS, JSON.stringify(existingBills));
  } catch (error) {
    console.error("Failed to delete bill from localStorage:", error);
  }
};

export const updateBillPaymentStatus = (billId: string, newStatus: 'paid' | 'pending' | 'partial', paymentDetails?: PaymentDetails): SavedBill | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const existingBills = loadBills();
    const billIndex = existingBills.findIndex(b => b.id === billId);
    if (billIndex > -1) {
      existingBills[billIndex].paymentStatus = newStatus;
      existingBills[billIndex].savedAt = new Date(); 
      if (newStatus === 'paid' && paymentDetails) {
        existingBills[billIndex].paymentDetails = paymentDetails;
      } else {
        existingBills[billIndex].paymentDetails = undefined; 
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_BILLS, JSON.stringify(existingBills));
      return existingBills[billIndex];
    }
  } catch (error) {
    console.error("Failed to update bill payment status in localStorage:", error);
  }
  return undefined;
};


interface FilterOptions {
  filterType: 'all' | 'today' | 'month' | 'year' | 'custom';
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  paymentStatus?: 'paid' | 'pending' | 'partial' | 'all';
}

export const filterBills = (bills: SavedBill[], options: FilterOptions): SavedBill[] => {
  const { filterType, customerId, startDate, endDate, paymentStatus } = options;
  const now = new Date();
  
  let customers: Customer[] = [];
  if (typeof window !== 'undefined') { 
      customers = loadCustomers();
  }


  return bills.filter(bill => {
    const billDate = bill.invoiceDetails.date ? new Date(bill.invoiceDetails.date) : null;
    if (!billDate) return false; 

    let dateMatch = false;
    switch (filterType) {
      case 'today':
        dateMatch = isWithinInterval(billDate, { start: startOfDay(now), end: endOfDay(now) });
        break;
      case 'month':
        dateMatch = isWithinInterval(billDate, { start: startOfMonth(now), end: endOfMonth(now) });
        break;
      case 'year':
        dateMatch = isWithinInterval(billDate, { start: startOfYear(now), end: endOfYear(now) });
        break;
      case 'custom':
        const validStartDate = startDate ? startOfDay(startDate) : null;
        const validEndDate = endDate ? endOfDay(endDate) : null;
        if (validStartDate && validEndDate) {
          dateMatch = isWithinInterval(billDate, { start: validStartDate, end: validEndDate });
        } else if (validStartDate) {
          dateMatch = billDate >= validStartDate;
        } else if (validEndDate) {
          dateMatch = billDate <= validEndDate;
        } else { 
          dateMatch = true; 
        }
        break;
      case 'all':
      default:
        dateMatch = true;
        break;
    }

    let customerMatch = true;
    if (customerId && customerId !== 'all_customers') {
      const selectedCustomer = customers.find(c => c.id === customerId);
      customerMatch = selectedCustomer ? bill.billTo.name === selectedCustomer.name : false;
    }
    
    let paymentStatusMatch = true;
    if (paymentStatus && paymentStatus !== 'all') {
        paymentStatusMatch = bill.paymentStatus === paymentStatus;
    }

    return dateMatch && customerMatch && paymentStatusMatch;
  });
};


let customers: Customer[] = [];
if (typeof window !== 'undefined') {
    customers = loadCustomers();
}
