'use client'; 

import { z } from 'zod';
import type { Customer } from '@/types/customer';
import { CustomerSchema } from '@/types/customer';
import { v4 as uuidv4 } from 'uuid'; 

const LOCAL_STORAGE_KEY = 'embroideryBillingCustomers';

/**
 * Loads customers from localStorage.
 * Returns an empty array if nothing is found or if running on the server.
 */
export const loadCustomers = (): Customer[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const result = z.array(CustomerSchema).safeParse(parsedData);
      if (result.success) {
        return result.data;
      } else {
        console.error("Invalid customer data found in localStorage:", result.error.flatten());
      }
    }
  } catch (error) {
    console.error("Failed to load customers from localStorage:", error);
  }
  return [];
};

/**
 * Saves the entire customer list to localStorage.
 * Does nothing if running on the server.
 * @param customers The array of customers to save.
 */
export const saveCustomers = (customers: Customer[]): void => {
   if (typeof window === 'undefined') {
    return;
  }
  try {
    const result = z.array(CustomerSchema).safeParse(customers);
    if (!result.success) {
        console.error("Attempted to save invalid customer data:", result.error.flatten());
        return;
    }
    const dataString = JSON.stringify(result.data); 
    localStorage.setItem(LOCAL_STORAGE_KEY, dataString);
  } catch (error) {
    console.error("Failed to save customers to localStorage:", error);
  }
};

/**
 * Adds a new customer to the list and saves to localStorage.
 * @param customerData Data for the new customer (without ID).
 * @returns The newly added customer with an ID.
 * @throws Error if a customer with the same name already exists or data is invalid.
 */
export const addCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
  const customers = loadCustomers();

  const existingCustomer = customers.find(c => c.name.trim().toLowerCase() === customerData.name.trim().toLowerCase());
  if (existingCustomer) {
    throw new Error(`Customer with name "${customerData.name}" already exists.`);
  }

  const newCustomerWithId: Customer = {
    ...customerData,
    id: uuidv4(), 
  };

  const validationResult = CustomerSchema.safeParse(newCustomerWithId);
  if (!validationResult.success) {
      console.error("Invalid customer data for adding:", validationResult.error.flatten());
      throw new Error(`Invalid customer data: ${validationResult.error.flatten().formErrors.join(', ')}`);
  }

  const updatedCustomers = [...customers, validationResult.data];
  saveCustomers(updatedCustomers);
  return validationResult.data;
};

/**
 * Updates an existing customer in the list and saves to localStorage.
 * @param id The ID of the customer to update.
 * @param updatedData The new data for the customer (without ID).
 * @returns The updated customer.
 * @throws Error if customer not found, name conflict, or data is invalid.
 */
export const updateCustomer = (id: string, updatedData: Omit<Customer, 'id'>): Customer => {
  const customers = loadCustomers();
  const customerIndex = customers.findIndex(c => c.id === id);

  if (customerIndex === -1) {
    throw new Error(`Customer with ID "${id}" not found.`);
  }

  // Check for name conflict with other customers
  const otherCustomers = customers.filter(c => c.id !== id);
  if (otherCustomers.some(c => c.name.trim().toLowerCase() === updatedData.name.trim().toLowerCase())) {
    throw new Error(`Another customer with name "${updatedData.name}" already exists.`);
  }
  
  const customerToUpdate: Customer = {
    ...updatedData,
    id, // Retain original ID
  };

  const validationResult = CustomerSchema.safeParse(customerToUpdate);
  if (!validationResult.success) {
    console.error("Invalid customer data for updating:", validationResult.error.flatten());
    throw new Error(`Invalid customer data: ${validationResult.error.flatten().formErrors.join(', ')}`);
  }

  const updatedCustomers = [...customers];
  updatedCustomers[customerIndex] = validationResult.data;
  saveCustomers(updatedCustomers);
  return validationResult.data;
};


/**
 * Gets a customer by their name (case-insensitive).
 * @param name The name of the customer to find.
 * @returns The customer object or undefined if not found.
 */
export const getCustomerByName = (name: string): Customer | undefined => {
  if (!name) return undefined;
  const customers = loadCustomers();
  return customers.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
};
