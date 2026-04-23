import { z } from 'zod';

export const InvoiceSettingsSchema = z.object({
  nextInvoiceNumber: z.coerce.number().int().positive().nullable().default(1),
  autoIncrementInvoiceNumber: z.boolean().default(true),
  defaultCGST: z.coerce.number().min(0).max(100).nullable().default(null),
  defaultSGST: z.coerce.number().min(0).max(100).nullable().default(null),
  defaultHSNCode: z.string().optional().default(''),
  pdfDownloadPath: z.string().optional().default(''),

  // Invoice Field Visibility Settings
  showCompanyGSTIN: z.boolean().default(true),
  showCompanyPAN: z.boolean().default(true),
  showCompanyPhone: z.boolean().default(true),
  showCompanyEmail: z.boolean().default(true),
  showCompanyStateAndCode: z.boolean().default(true),
  
  showCustomerGSTIN: z.boolean().default(true),
  showCustomerPAN: z.boolean().default(true),
  showCustomerStateAndCode: z.boolean().default(true),
  
  showHSNCodeColumn: z.boolean().default(true),
  showBankDetailsSection: z.boolean().default(true),
  showTermsAndConditionsSection: z.boolean().default(true),
});

export type InvoiceSettingsData = z.infer<typeof InvoiceSettingsSchema>;

// Parse an empty object to get an object with all default values
export const defaultInvoiceSettings: InvoiceSettingsData = InvoiceSettingsSchema.parse({});
