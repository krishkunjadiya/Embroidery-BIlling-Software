import type { BillFormData, BillItem, CalculatedAmounts, FullBillData as SharedFullBillData, PaymentDetails as SharedPaymentDetails } from './billing'; // Import from billing to reuse

// Re-exporting or aliasing types from billing.ts for clarity if needed, or ensure they are directly used.
export type { BillFormData, BillItem, CalculatedAmounts };
export type PaymentDetails = SharedPaymentDetails; // Explicitly re-export

// Interface for the complete data used by the BillPreview component, extending the shared one
export interface FullBillData extends SharedFullBillData {
  // paymentDetails is inherited from SharedFullBillData
}

// Interface for a saved bill (could be stored in localStorage or a database)
export interface SavedBill extends FullBillData {
  id: string; // Unique ID for the saved bill
  savedAt: Date; // Timestamp when the bill was saved
  // paymentStatus and paymentDetails are inherited from FullBillData
}
