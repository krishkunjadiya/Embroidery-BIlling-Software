'use client';

import type { BillFormData, FullBillData, BillItem } from '@/types/billing'; 
import type { SavedBill } from '@/types/bill';
import { BillFormSchema } from '@/types/billing';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Save } from 'lucide-react';
import { calculateBillAmounts, getDefaultBillFormData, getInitialBillItem } from '@/lib/billing-utils';
import BillForm from './BillForm';
import { useToast } from '@/hooks/use-toast';
import { Form } from '@/components/ui/form';
import { saveBill as saveBillToStorage } from '@/services/billService'; 
import { loadInvoiceSettings } from '@/services/invoiceSettingsService';
import { v4 as uuidv4 } from 'uuid'; 
import { exportBillWithReactPdf } from '@/services/reactPdfService';
import ReactPdfPreview from './ReactPdfPreview';

export default function BillingPage() {
  const [billDataForPreview, setBillDataForPreview] = useState<FullBillData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [currentBillId, setCurrentBillId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState(loadInvoiceSettings());
  const [showPreview, setShowPreview] = useState(false);

  const formMethods = useForm<BillFormData>({
    resolver: zodResolver(BillFormSchema),
    mode: 'onChange', 
    criteriaMode: 'firstError',
    shouldFocusError: true,
  });

  const { control, handleSubmit, reset, formState: { errors }, setValue, getValues, trigger } = formMethods;

  const initializeNewBill = useCallback(() => {
    const currentSettings = loadInvoiceSettings(); // Load fresh settings
    setInvoiceSettings(currentSettings);
    const defaultData = getDefaultBillFormData(currentSettings); // Pass settings to get defaults
    reset(defaultData);
    
    // Generate a new UUID for the bill
    const newBillId = uuidv4();
    setCurrentBillId(newBillId); 

    if (defaultData.invoiceDetails.date) {
      setValue('invoiceDetails.date', defaultData.invoiceDetails.date, { shouldValidate: true, shouldDirty: true });
    }
    
    // Ensure we have at least one item in the bill
    if (!getValues('items') || getValues('items').length === 0) {
       // Use default HSN from potentially updated settings
      setValue('items', [getInitialBillItem(currentSettings.defaultHSNCode)], { shouldValidate: true, shouldDirty: true });
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, setValue]); 

  useEffect(() => {
    setIsClient(true);
    initializeNewBill();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeNewBill]);


  const watchedFields = useWatch({ control });

  const updatePreview = () => {
    if (!isClient) return;

    const currentFormData = getValues();
    const currentDisplaySettings = invoiceSettings;
    
    const itemsWithAmount: BillItem[] = (currentFormData.items || []).map((item: Partial<BillItem>) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return {
        ...item,
        id: item.id || String(Date.now() + Math.random()), 
        description: item.description || "",
        hsnCode: item.hsnCode || "",
        unit: item.unit || "pcs",
        quantity,
        rate,
        amount: quantity * rate,
      };
    });

    const itemsForCalculation = itemsWithAmount.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
    }));

    const formDataForCalculation: BillFormData = {
        ...currentFormData,
        items: itemsForCalculation,
        discountPercentage: Number(currentFormData.discountPercentage) || 0,
        gstSettings: {
            cgstRate: Number(currentFormData.gstSettings?.cgstRate) || 0,
            sgstRate: Number(currentFormData.gstSettings?.sgstRate) || 0,
        },
        applyDiscountToTaxableAmount: currentFormData.applyDiscountToTaxableAmount ?? true, 
    };

    const calculatedAmounts = calculateBillAmounts(formDataForCalculation);

    setBillDataForPreview({
      ...currentFormData, 
      items: itemsWithAmount, 
      calculatedAmounts,
      companyDetails: currentFormData.companyDetails,
      billTo: currentFormData.billTo,
      invoiceDetails: currentFormData.invoiceDetails,
      discountPercentage: currentFormData.discountPercentage,
      applyDiscountToTaxableAmount: currentFormData.applyDiscountToTaxableAmount,
      gstSettings: currentFormData.gstSettings,
      bankDetails: currentFormData.bankDetails,
      termsAndConditions: currentFormData.termsAndConditions,
      paymentStatus: 'pending', 
      invoiceDisplaySettings: currentDisplaySettings,
    });
    
    setShowPreview(true);
  };

  useEffect(() => {
    if (isPrinting && billDataForPreview) {
      const printableArea = document.querySelector('.printable-area');
      const billPreviewContent = printableArea ? printableArea.querySelector('.printable-area-content') : null;
  
      if (printableArea && billPreviewContent) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { 
            window.print();
            toast({ 
              title: "Print Initiated", 
              description: "Your browser's print dialog should now be open. Choose 'Save as PDF' as the destination." 
            });
            setIsPrinting(false); 
          });
        });
      } else {
        toast({ title: "Print Error", description: "Bill preview content is not ready. Please try again.", variant: "destructive" });
        setIsPrinting(false); 
      }
    }
  }, [isPrinting, billDataForPreview, toast]);
  

  const onSubmitAndSave = async (validatedFormData: BillFormData) => {
    if (!isClient) return;

    // Validate that we have all needed data
    if (!currentBillId) {
      toast({ title: "Error", description: "Bill ID is missing. Cannot save.", variant: "destructive" });
      return;
    }

    const currentDisplaySettings = invoiceSettings;

    const itemsWithAmount: BillItem[] = (validatedFormData.items || []).map((item: Partial<BillItem>) => {
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        return {
            ...item,
            id: item.id || String(Date.now() + Math.random()),
            description: item.description || "",
            hsnCode: item.hsnCode || "",
            unit: item.unit || "pcs",
            quantity,
            rate,
            amount: quantity * rate,
        };
    });

    const itemsForCalculation = itemsWithAmount.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
    }));
    
    const formDataForCalculation: BillFormData = {
        ...validatedFormData,
        items: itemsForCalculation,
        discountPercentage: Number(validatedFormData.discountPercentage) || 0,
        gstSettings: {
            cgstRate: Number(validatedFormData.gstSettings?.cgstRate) || 0,
            sgstRate: Number(validatedFormData.gstSettings?.sgstRate) || 0,
        },
        applyDiscountToTaxableAmount: validatedFormData.applyDiscountToTaxableAmount ?? true,
    };

    const calculatedAmounts = calculateBillAmounts(formDataForCalculation);

    const fullBillDataForSave: FullBillData = {
        ...validatedFormData,
        items: itemsWithAmount,
        calculatedAmounts,
        companyDetails: validatedFormData.companyDetails,
        billTo: validatedFormData.billTo,
        invoiceDetails: {
          ...validatedFormData.invoiceDetails,
          // Ensure date is a valid Date object
          date: validatedFormData.invoiceDetails.date instanceof Date ? 
                validatedFormData.invoiceDetails.date : 
                (validatedFormData.invoiceDetails.date ? new Date(validatedFormData.invoiceDetails.date) : null)
        },
        discountPercentage: validatedFormData.discountPercentage,
        applyDiscountToTaxableAmount: validatedFormData.applyDiscountToTaxableAmount,
        gstSettings: validatedFormData.gstSettings,
        bankDetails: validatedFormData.bankDetails,
        termsAndConditions: validatedFormData.termsAndConditions,
        paymentStatus: 'pending', 
        invoiceDisplaySettings: currentDisplaySettings,
    };

    const billToSave: SavedBill = {
      ...fullBillDataForSave,
      id: currentBillId,
      savedAt: new Date(),
    };

    console.log("Saving bill:", billToSave);

    try {
      saveBillToStorage(billToSave);
      toast({
        title: "Bill Saved Successfully!",
        description: `Invoice ${billToSave.invoiceDetails.invoiceNumber} has been saved.`,
      });
      
      setBillDataForPreview(fullBillDataForSave);
      
      // After saving, attempt to export the bill as PDF to customer folder
      const pdfBasePath = invoiceSettings.pdfDownloadPath;
      if (pdfBasePath && window.electron?.savePdfToFolder) {
        try {
          const success = await exportBillWithReactPdf(billToSave as SavedBill);
          if (success) {
            toast({
              title: "PDF Saved",
              description: `Invoice PDF saved in ${billToSave.billTo.name}'s folder.`,
            });
          } else {
            toast({
              title: "PDF Export Warning",
              description: "PDF may have been generated but encountered issues. Check output folder.",
              variant: "default"
            });
          }
        } catch (pdfError) {
          console.error("Failed to export PDF:", pdfError);
          toast({
            title: "PDF Export Failed",
            description: "There was a problem generating the PDF. Check console for details.",
            variant: "destructive"
          });
        }
      }
      
      initializeNewBill();

    } catch (error) {
      console.error("Failed to save bill:", error);
      toast({
        title: "Error Saving Bill",
        description: "There was a problem saving your bill. Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleSaveBill = async () => {
    // Use the full trigger function to ensure focus on first error field
    const isValid = await trigger(undefined, { shouldFocus: true });
    
    if (!isValid) {
      // Find the first error field
      const fieldNames = Object.keys(errors);
      if (fieldNames.length > 0) {
        // Log the error for debugging
        console.log('Validation errors:', errors);
        
        toast({
          title: 'Validation Error', 
          description: 'Please complete all required fields.', 
          variant: 'destructive'
        });
      }
      return;
    }

    // First prepare the form data with all calculations
    const billData = getValues();
    
    // Generate proper items with amount
    const itemsWithAmount = (billData.items || []).map(item => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return {
        ...item,
        id: item.id || String(Date.now() + Math.random()),
        quantity, 
        rate,
        amount: quantity * rate,
      };
    });

    // Prepare data for calculation
    const formDataForCalculation = {
      ...billData,
      items: itemsWithAmount,
      discountPercentage: Number(billData.discountPercentage) || 0,
      gstSettings: {
        cgstRate: Number(billData.gstSettings?.cgstRate) || 0,
        sgstRate: Number(billData.gstSettings?.sgstRate) || 0,
      },
      applyDiscountToTaxableAmount: billData.applyDiscountToTaxableAmount ?? true,
    };

    // Calculate amounts
    const calculatedAmounts = calculateBillAmounts(formDataForCalculation);
    
    // Create full bill data for PDF
    const fullBillData: FullBillData = {
      ...billData,
      items: itemsWithAmount,
      calculatedAmounts,
      paymentStatus: 'pending',
      invoiceDisplaySettings: invoiceSettings,
    };

    // Save the bill
    await onSubmitAndSave(billData);
    toast({ title: 'Success', description: 'Bill saved successfully' });
    setShowPreview(false);
    
    // Export PDF with the complete data
    const settings = loadInvoiceSettings();
    if (settings.pdfDownloadPath && typeof window !== 'undefined' && window.electron?.savePdfToFolder) {
      try {
        // Use the fullBillData with calculated amounts instead of just billData
        const success = await exportBillWithReactPdf(fullBillData as SavedBill);
        if (success) {
          toast({ title: 'Success', description: 'PDF exported successfully' });
        } else {
          toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' });
      }
      } catch (error) {
        console.error("Error exporting PDF:", error);
        toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' });
      }
    }
  };
  
  const handlePrintBill = () => {
    if (!billDataForPreview) {
      toast({
        title: "Cannot Print",
        description: "No bill data available to print. Please ensure the bill is generated.",
        variant: "destructive",
      });
      return;
    }
    setIsPrinting(true); // This will trigger the useEffect for printing
  };


  const handleClearForm = () => {
    initializeNewBill(); 
    toast({
      title: "Form Cleared",
      description: "All fields have been reset for a new bill.",
    });
    setShowPreview(false);
  };

  const renderPreview = () => {
    if (!billDataForPreview) return null;
    
    return (
      <>
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="text-2xl font-semibold">Invoice Preview</h2>
        </div>
          <ReactPdfPreview data={billDataForPreview} />
      </>
    );
  };

  const handleSavePdf = async () => {
    if (!billDataForPreview) return;
    
    const pdfBasePath = invoiceSettings.pdfDownloadPath;
    if (!pdfBasePath) {
      toast({
        title: "PDF Download Path Not Set",
        description: "Please configure the PDF download path in settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);
    try {
      const success = await exportBillWithReactPdf(billDataForPreview as SavedBill);

      if (success) {
        toast({
          title: "Success",
          description: "PDF has been saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save PDF. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isClient) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-10">Loading form...</div>
      </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <div className="container mx-auto p-4 md:p-6">
        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Create New Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...formMethods}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                  <BillForm control={control} errors={errors} />
                  <Separator />
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 no-print">
                     <Button type="button" variant="outline" onClick={handleClearForm} className="w-full sm:w-auto" >
                      <Trash2 className="mr-2 h-4 w-4" /> Clear Form
                    </Button>
                    <Button type="button" onClick={handleSaveBill} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" >
                      <Save className="mr-2 h-4 w-4" /> Save Bill
                    </Button>
                     <Button type="button" onClick={handlePrintBill} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" >
                      <Save className="mr-2 h-4 w-4" /> Print Bill
                    </Button>
                  </div>
                </form>
               </Form>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-primary">Bill Preview</CardTitle>
                {!showPreview && (
                  <Button onClick={updatePreview}>
                    Generate Preview
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex justify-center bg-gray-100 p-8">
              <div className="printable-area w-[210mm] bg-white shadow-lg rounded-sm">
                {showPreview && billDataForPreview ? renderPreview() : (
                  <p className="text-muted-foreground text-center py-10">
                    Click "Generate Preview" to see your bill.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="no-print justify-end">
              {showPreview && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)} 
                  className="mr-2"
                >
                  Hide Preview
                </Button>
              )}
              <p className="text-sm text-muted-foreground ml-2">Preview on demand to improve performance.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}
