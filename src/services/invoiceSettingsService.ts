'use client';

import type { InvoiceSettingsData } from '@/types/invoiceSettings';
import { InvoiceSettingsSchema, defaultInvoiceSettings } from '@/types/invoiceSettings';

const LOCAL_STORAGE_KEY = 'embroideryBillingInvoiceSettings';

export const loadInvoiceSettings = (): InvoiceSettingsData => {
  if (typeof window === 'undefined') {
    return { ...defaultInvoiceSettings }; // Return a copy
  }
  try {
    const storedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedDataString) {
      const parsedData = JSON.parse(storedDataString);
      const validationResult = InvoiceSettingsSchema.safeParse(parsedData);
      if (validationResult.success) {
        // Ensure all default fields are present even if not in stored data
        return { ...defaultInvoiceSettings, ...validationResult.data };
      } else {
        console.error("Invalid invoice settings found in localStorage, using defaults:", validationResult.error.flatten());
        // Save defaults if current data is invalid
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultInvoiceSettings));
        return { ...defaultInvoiceSettings };
      }
    }
  } catch (error) {
    console.error("Failed to load or parse invoice settings from localStorage, using defaults:", error);
  }
  // If nothing stored or error, save and return defaults
  if (typeof window !== 'undefined') { // Check again for SSR safety
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultInvoiceSettings));
  }
  return { ...defaultInvoiceSettings };
};

export const saveInvoiceSettings = (data: InvoiceSettingsData): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const validationResult = InvoiceSettingsSchema.safeParse(data);
    if (validationResult.success) {
      const dataString = JSON.stringify(validationResult.data);
      localStorage.setItem(LOCAL_STORAGE_KEY, dataString);
    } else {
      console.error("Attempted to save invalid invoice settings:", validationResult.error.flatten());
    }
  } catch (error) {
    console.error("Failed to save invoice settings to localStorage:", error);
  }
};
