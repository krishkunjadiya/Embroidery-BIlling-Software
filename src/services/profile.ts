'use client'; // Mark as client component because it uses localStorage

import type { ProfileData } from '@/types/profile';
import { ProfileDataSchema, defaultProfileData } from '@/types/profile';

const LOCAL_STORAGE_KEY = 'embroideryBillingProfile';

/**
 * Loads profile data from localStorage.
 * Returns default data if nothing is found or if running on the server.
 * Ensures that the returned data structure is complete with defaults for optional fields.
 */
export const loadProfileData = (): ProfileData => {
  // Start with a deep copy of defaultProfileData to ensure all keys are present
  const baseData: ProfileData = JSON.parse(JSON.stringify(defaultProfileData));

  if (typeof window === 'undefined') {
    return baseData;
  }

  try {
    const storedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedDataString) {
      const parsedStoredData = JSON.parse(storedDataString);

      // Merge companyDetails: ensure all default keys are present even if not in stored data
      baseData.companyDetails = {
        ...defaultProfileData.companyDetails, // Start with all defaults for companyDetails
        ...(parsedStoredData.companyDetails || {}),
      };
      
      // Ensure each company detail field is a string if it exists in baseData.companyDetails
      // This handles cases where a field might have been null or undefined previously
      Object.keys(baseData.companyDetails).forEach(key => {
        const K = key as keyof ProfileData['companyDetails'];
        if (baseData.companyDetails[K] === null || typeof baseData.companyDetails[K] === 'undefined') {
           baseData.companyDetails[K] = ''; // Set to empty string if null or undefined
        }
      });


      // Merge bankDetails: ensure bankDetails itself is an object and its properties are defaulted
      baseData.bankDetails = {
        ...(defaultProfileData.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', branchName: '' }), 
        ...(parsedStoredData.bankDetails || {}),
      };
      
      if (baseData.bankDetails) {
        baseData.bankDetails.bankName = baseData.bankDetails.bankName || '';
        baseData.bankDetails.accountNumber = baseData.bankDetails.accountNumber || '';
        baseData.bankDetails.ifscCode = baseData.bankDetails.ifscCode || '';
        baseData.bankDetails.branchName = baseData.bankDetails.branchName || '';
      }


      const validationResult = ProfileDataSchema.safeParse(baseData);
      if (validationResult.success) {
        return validationResult.data;
      } else {
        console.error("Validation failed for profile data from localStorage after merge:", validationResult.error.flatten());
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultProfileData)); 
        return JSON.parse(JSON.stringify(defaultProfileData)); 
      }
    }
  } catch (error) {
    console.error("Failed to load or parse profile data from localStorage:", error);
  }
  return JSON.parse(JSON.stringify(defaultProfileData));
};

/**
 * Saves profile data to localStorage.
 * Does nothing if running on the server.
 * @param data The profile data to save.
 */
export const saveProfileData = (data: ProfileData): void => {
   if (typeof window === 'undefined') {
    return;
  }
  try {
    // Validate data before saving
    const validationResult = ProfileDataSchema.safeParse(data);
    if (validationResult.success) {
      const dataString = JSON.stringify(validationResult.data);
      localStorage.setItem(LOCAL_STORAGE_KEY, dataString);
    } else {
      console.error("Attempted to save invalid profile data:", validationResult.error.flatten());
    }
  } catch (error) {
    console.error("Failed to save profile data to localStorage:", error);
  }
};
