import { z } from 'zod';
import type { InvoiceSettingsData } from './invoiceSettings';

// Schema for individual bill items
export const BillItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Particular is required"),
  hsnCode: z.string().optional(),
  quantity: z.coerce.number({invalid_type_error: "Meter must be a number"})
    .positive({ message: "Meter must be positive" })
    .nullable(), 
  unit: z.string().optional().default('Mtr.'),
  rate: z.coerce.number({invalid_type_error: "Rate must be a number"})
    .min(0, "Rate must be non-negative")
    .nullable(), 
});
export type BillItem = z.infer<typeof BillItemSchema> & { amount: number }; 

// Helper for required non-empty strings
const nonEmptyString = (message: string) => z.string().min(1, { message });

// Payment Details Schemas
const BasePaymentDetailsSchema = z.object({
  paymentDate: z.date().optional().default(() => new Date()),
});

export const CashPaymentDetailsSchema = BasePaymentDetailsSchema.extend({
  method: z.literal('cash'),
});
export type CashPaymentDetails = z.infer<typeof CashPaymentDetailsSchema>;

export const OnlinePaymentDetailsSchema = BasePaymentDetailsSchema.extend({
  method: z.literal('online'),
  appName: z.string().min(1, "App name is required for online payment"),
  upiId: z.string().min(1, "UPI ID is required for online payment"),
  transactionId: z.string().optional(),
});
export type OnlinePaymentDetails = z.infer<typeof OnlinePaymentDetailsSchema>;

export const ChequePaymentDetailsSchema = BasePaymentDetailsSchema.extend({
  method: z.literal('cheque'),
  bankName: z.string().min(1, "Bank name is required for cheque payment"),
  chequeNumber: z.string().min(1, "Cheque number is required"),
  chequeDate: z.date({ required_error: "Cheque date is required" }),
});
export type ChequePaymentDetails = z.infer<typeof ChequePaymentDetailsSchema>;

export const PaymentDetailsSchema = z.discriminatedUnion("method", [
  CashPaymentDetailsSchema,
  OnlinePaymentDetailsSchema,
  ChequePaymentDetailsSchema,
]);
export type PaymentDetails = z.infer<typeof PaymentDetailsSchema>;


// Main schema for the entire bill form
export const BillFormSchema = z.object({
  companyDetails: z.object({
    name: nonEmptyString("Company name is required"),
    address: nonEmptyString("Company address is required"),
    gstin: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
    pan: z.string().optional(),
    state: z.string().optional(),
    stateCode: z.string().optional(),
  }),
  billTo: z.object({
    name: nonEmptyString("Customer name is required"),
    address: nonEmptyString("Customer address is required"),
    gstin: z.string().optional(),
    state: z.string().optional(),
    stateCode: z.string().optional(),
    pan: z.string().optional(),
  }),
  invoiceDetails: z.object({
    invoiceNumber: nonEmptyString("Invoice number is required"),
    date: z.date({ required_error: "Invoice date is required", invalid_type_error: "Invalid date" }).nullable(), 
  }),
  items: z.array(BillItemSchema.omit({ amount: true as never })) 
    .min(1, "At least one item is required")
    .refine(items => items.every(item => item.quantity !== null && item.rate !== null && item.quantity > 0 && item.rate >= 0), {
      message: "Meter and Rate are required and must be valid numbers for all items.",
      path: ["items"], 
    }),
  discountPercentage: z.coerce.number({invalid_type_error: "Discount must be a number"})
    .min(0, "Discount percentage must be non-negative")
    .max(100, "Discount percentage cannot exceed 100")
    .nullable()
    .optional(),
  applyDiscountToTaxableAmount: z.boolean().optional().default(true),
  gstSettings: z.object({
    cgstRate: z.coerce.number({invalid_type_error: "CGST Rate must be a number"})
        .min(0).max(100).nullable().optional(), 
    sgstRate: z.coerce.number({invalid_type_error: "SGST Rate must be a number"})
        .min(0).max(100).nullable().optional(), 
  }),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    branchName: z.string().optional(),
  }).optional(),
  termsAndConditions: z.string().optional(),
});

export type BillFormData = z.infer<typeof BillFormSchema>;

export interface CalculatedAmounts {
  subTotalBeforeDiscount: number;
  discountApplied: number; 
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  amountInWords: string;
}

export interface FullBillData extends BillFormData {
  items: BillItem[]; 
  calculatedAmounts: CalculatedAmounts;
  paymentStatus: 'pending' | 'paid' | 'partial'; 
  paymentDetails?: PaymentDetails;
  invoiceDisplaySettings?: InvoiceSettingsData; // Added to pass display settings to preview
}
