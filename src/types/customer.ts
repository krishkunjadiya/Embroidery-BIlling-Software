import { z } from 'zod';

// Helper for required non-empty strings
const nonEmptyString = (message: string) => z.string().min(1, { message });

export const CustomerSchema = z.object({
  id: z.string().uuid(), // Assuming UUID for unique identification
  name: nonEmptyString("Customer name is required"),
  address: nonEmptyString("Customer address is required"),
  gstin: z.string().optional().default(''),
  state: z.string().optional().default(''),
  stateCode: z.string().optional().default(''),
  pan: z.string().optional().default(''),
  // placeOfSupply: z.string().optional().default(''), // Removed placeOfSupply
});

export type Customer = z.infer<typeof CustomerSchema>;
