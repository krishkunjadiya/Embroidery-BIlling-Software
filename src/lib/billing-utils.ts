import type { BillFormData, BillItem, CalculatedAmounts } from '@/types/billing';
import { loadProfileData } from '@/services/profile'; 
import type { InvoiceSettingsData} from '@/types/invoiceSettings'; // Import InvoiceSettingsData
import { defaultInvoiceSettings as appDefaultSettings } from '@/types/invoiceSettings';


export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (isNaN(amount) || !isFinite(amount)) {
    amount = 0; 
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const roundToTwoDecimals = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const numberToWords = (num: number): string => {
  if (!isFinite(num) || isNaN(num)) return 'Zero Rupees Only'; 

  const roundedNum = roundToTwoDecimals(num);
  if (roundedNum === 0) return 'Zero Rupees Only';


  const indianRupeesWords = (n: number): string => {
    if (n === 0) return "";
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    let str = '';
    if (n > 9999999) { 
        str += indianRupeesWords(Math.floor(n / 10000000)) + ' Crore ';
        n %= 10000000;
    }
    if (n > 99999) { 
        str += indianRupeesWords(Math.floor(n / 100000)) + ' Lakh ';
        n %= 100000;
    }
    if (n > 999) { 
        str += indianRupeesWords(Math.floor(n / 1000)) + ' Thousand ';
        n %= 1000;
    }
    if (n > 99) { 
        str += indianRupeesWords(Math.floor(n / 100)) + ' Hundred ';
        n %= 100;
    }
    if (n > 0) { 
    }
    if (n > 19) {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    } else {
        str += a[n];
    }
    return str.trim();
  };

  const rupees = Math.floor(Math.abs(roundedNum));
  const paise = Math.round((Math.abs(roundedNum) - rupees) * 100);

  let rupeesStr = rupees > 0 ? indianRupeesWords(rupees) : "";
  let paiseStr = paise > 0 ? indianRupeesWords(paise) : "";

  let words = "";
  if (rupeesStr) {
    words += rupeesStr + ' Rupees';
  }

  if (paiseStr) {
    if (words && rupees > 0) { 
      words += ' and ';
    }
    words += paiseStr + ' Paise';
  }

  if (words === "") { 
      return "Zero Rupees Only";
  }

  words += ' Only';
  return words.replace(/\s+/g, ' ').trim(); 
};


export const calculateBillAmounts = (data: BillFormData): CalculatedAmounts => {
  const safeItems = (data.items || []).map(item => ({
    ...item,
    quantity: Number(item.quantity) || 0,
    rate: Number(item.rate) || 0,
  }));

  const subTotalBeforeDiscountRaw = safeItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const subTotalBeforeDiscount = roundToTwoDecimals(subTotalBeforeDiscountRaw);

  let actualCalculatedDiscountAmountRaw = 0;
  if (data.discountPercentage != null && data.discountPercentage > 0) {
    actualCalculatedDiscountAmountRaw = (subTotalBeforeDiscount * data.discountPercentage) / 100;
  }
  let actualCalculatedDiscountAmount = roundToTwoDecimals(actualCalculatedDiscountAmountRaw);
  actualCalculatedDiscountAmount = Math.max(0, actualCalculatedDiscountAmount);


  const discountValueAppliedToTaxable = data.applyDiscountToTaxableAmount ? actualCalculatedDiscountAmount : 0;

  let taxableAmountRaw = subTotalBeforeDiscount - discountValueAppliedToTaxable;
  let taxableAmount = roundToTwoDecimals(taxableAmountRaw);
  if (taxableAmount < 0) taxableAmount = 0;

  const gstSettings = data.gstSettings || {};
  const cgstRate = Number(gstSettings.cgstRate) || 0;
  const sgstRate = Number(gstSettings.sgstRate) || 0;

  const cgstAmountRaw = taxableAmount * (cgstRate / 100);
  const cgstAmount = roundToTwoDecimals(cgstAmountRaw);

  const sgstAmountRaw = taxableAmount * (sgstRate / 100);
  const sgstAmount = roundToTwoDecimals(sgstAmountRaw);

  const totalTaxAmountRaw = cgstAmount + sgstAmount;
  const totalTaxAmount = roundToTwoDecimals(totalTaxAmountRaw);

  let grandTotalRaw = taxableAmount + totalTaxAmount;

  if (!data.applyDiscountToTaxableAmount && actualCalculatedDiscountAmount > 0) {
    grandTotalRaw -= actualCalculatedDiscountAmount;
  }

  let grandTotal = roundToTwoDecimals(grandTotalRaw);
  if (grandTotal < 0) grandTotal = 0;

  const amountInWords = numberToWords(grandTotal);

  return {
    subTotalBeforeDiscount: subTotalBeforeDiscount,
    discountApplied: actualCalculatedDiscountAmount,
    taxableAmount: taxableAmount,
    cgstAmount: cgstAmount,
    sgstAmount: sgstAmount,
    totalTaxAmount: totalTaxAmount,
    grandTotal: grandTotal,
    amountInWords,
  };
};


export const getInitialBillItem = (defaultHSN?: string | null): Omit<BillItem, 'amount'> => ({
  id: Date.now().toString() + Math.random().toString(36).substring(2,7),
  description: '',
  hsnCode: defaultHSN || '',
  quantity: null as number | null,
  unit: 'Mtr.',
  rate: null as number | null,
});

export const getDefaultBillFormData = (settings?: InvoiceSettingsData): BillFormData => {
  const initialDate = new Date();
  const loadedProfileData = loadProfileData(); 
  const invoiceSettings = settings || appDefaultSettings; // Use passed settings or app defaults

  const defaultTerms = [
    "Subject to SURAT jurisdiction.",
    "1.Goods Sold Will Not Be Taken Back",
    "2.Goods Will Be despatched On Customer Risk.",
    "3.We Have Received The Goods In Goods Conditions",
    "PAYMENT WITHIN 45 DAYS OF GOOD SOLD AS PER ME. & O. E."
  ].join('\n');
  
  const nextInvoiceNumStr = invoiceSettings.nextInvoiceNumber ? String(invoiceSettings.nextInvoiceNumber) : '';

  return {
    companyDetails: {
      name: loadedProfileData.companyDetails?.name || "Enter Company Name",
      address: loadedProfileData.companyDetails?.address || "Enter Company Address",
      gstin: loadedProfileData.companyDetails?.gstin || "",
      phone: loadedProfileData.companyDetails?.phone || "",
      email: loadedProfileData.companyDetails?.email || "",
      pan: loadedProfileData.companyDetails?.pan || "",
      state: loadedProfileData.companyDetails?.state || "",
      stateCode: loadedProfileData.companyDetails?.stateCode || "",
    },
    billTo: {
      name: '',
      address: '',
      gstin: '',
      state: '',
      stateCode: '',
      pan: '',
    },
    invoiceDetails: {
      invoiceNumber: nextInvoiceNumStr,
      date: initialDate,
    },
    items: [getInitialBillItem(invoiceSettings.defaultHSNCode)],
    discountPercentage: null as number | null,
    applyDiscountToTaxableAmount: true,
    gstSettings: {
      cgstRate: invoiceSettings.defaultCGST,
      sgstRate: invoiceSettings.defaultSGST,
    },
    bankDetails: {
      bankName: loadedProfileData.bankDetails?.bankName || "",
      accountNumber: loadedProfileData.bankDetails?.accountNumber || "",
      ifscCode: loadedProfileData.bankDetails?.ifscCode || "",
      branchName: loadedProfileData.bankDetails?.branchName || "",
    },
    termsAndConditions: defaultTerms,
  };
};
