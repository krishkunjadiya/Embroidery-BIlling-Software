import { z } from 'zod';

// Reusing parts of BillFormSchema for consistency
const nonEmptyString = (message: string) => z.string().min(1, { message });

export const ProfileDataSchema = z.object({
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
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    branchName: z.string().optional(),
  }).optional(),
});

export type ProfileData = z.infer<typeof ProfileDataSchema>;

// Default empty state for the profile
export const defaultProfileData: ProfileData = {
  companyDetails: {
    name: '',
    address: '',
    gstin: '',
    phone: '',
    email: '',
    pan: '',
    state: '',
    stateCode: '',
  },
  bankDetails: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
  },
};
