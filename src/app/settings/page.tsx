'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceSettingsData } from '@/types/invoiceSettings';
import { InvoiceSettingsSchema, defaultInvoiceSettings } from '@/types/invoiceSettings';
import { loadInvoiceSettings, saveInvoiceSettings } from '@/services/invoiceSettingsService';
import { Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ExportSettings from '@/components/settings/ExportSettings';
import PDFSettings from '@/components/settings/PDFSettings';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isClientMounted, setIsClientMounted] = useState(false);

  const formMethods = useForm<InvoiceSettingsData>({
    resolver: zodResolver(InvoiceSettingsSchema),
    defaultValues: JSON.parse(JSON.stringify(defaultInvoiceSettings)), // Deep copy
  });

  const { handleSubmit, control, reset, formState: { isSubmitting, isDirty } } = formMethods;

  useEffect(() => {
    setIsClientMounted(true);
    const loadedSettings = loadInvoiceSettings();
    reset(loadedSettings);
  }, [reset]);

  const onSubmit = (data: InvoiceSettingsData) => {
    saveInvoiceSettings(data);
    reset(data); // Reset form with saved data to clear dirty state and reflect new defaults
    toast({
      title: 'Settings Saved',
      description: 'Invoice settings have been updated successfully.',
    });
  };
  
  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    if (document.activeElement === event.currentTarget) {
      event.currentTarget.blur();
    }
  };

  if (!isClientMounted) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Settings</h1>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Settings</h1>
      
      <div className="space-y-6">
      <FormProvider {...formMethods}>
        <Form {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invoice Numbering Section */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground">Invoice Numbering</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <FormField
                      control={control}
                      name="nextInvoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Invoice Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              value={field.value === null || field.value === undefined ? '' : String(field.value)}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                              onWheel={handleWheel}
                              placeholder="e.g., 1" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="autoIncrementInvoiceNumber"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 h-full">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                              id="autoIncrementInvoiceNumber"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel htmlFor="autoIncrementInvoiceNumber" className="font-normal cursor-pointer">
                              Auto-increment Invoice Number
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !isDirty}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Invoice Number Settings
                    </Button>
                  </div>
                </section>

                <Separator />

                {/* Default Tax Rates Section */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground">Default Tax Rates &amp; HSN</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name="defaultCGST"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default CGST (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === null || field.value === undefined ? '' : String(field.value)}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                              onWheel={handleWheel}
                              placeholder="e.g., 2.5" 
                              step="any"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="defaultSGST"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default SGST (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === null || field.value === undefined ? '' : String(field.value)}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                              onWheel={handleWheel}
                              placeholder="e.g., 2.5"
                              step="any"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="defaultHSNCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default HSN Code</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="e.g., 5810" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="button"
                      onClick={() => {
                        const currentValues = formMethods.getValues();
                        const taxSettings = {
                          ...loadInvoiceSettings(),
                          defaultCGST: currentValues.defaultCGST,
                          defaultSGST: currentValues.defaultSGST,
                          defaultHSNCode: currentValues.defaultHSNCode,
                        };
                        saveInvoiceSettings(taxSettings);
                        toast({
                          title: 'Tax Settings Saved',
                          description: 'Default tax rates and HSN code have been updated.',
                        });
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Tax Settings
                    </Button>
                  </div>
                </section>

                <Separator />

                {/* Invoice Field Visibility Section */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground">Invoice Field Visibility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4 border rounded-lg p-4">
                      <h4 className="font-medium">Company Information</h4>
                      <div className="space-y-2">
                        <FormField
                          control={control}
                          name="showCompanyGSTIN"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Company GSTIN</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="showCompanyPAN"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Company PAN</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="showCompanyPhone"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Company Phone</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="showCompanyEmail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Company Email</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="showCompanyStateAndCode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Company State & Code</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                      <h4 className="font-medium">Customer Information</h4>
                      <div className="space-y-2">
                        <FormField
                          control={control}
                          name="showCustomerGSTIN"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Customer GSTIN</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="showCustomerPAN"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Customer PAN</FormLabel>
                            </FormItem>
                          )}
                        />
                      <FormField
                        control={control}
                          name="showCustomerStateAndCode"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                  checked={field.value === true}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Customer State & Code</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                              </div>

                    <div className="space-y-4 border rounded-lg p-4 md:col-span-2">
                      <h4 className="font-medium">Additional Sections</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={control}
                          name="showHSNCodeColumn"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show HSN Code Column (Items)</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="showBankDetailsSection"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Bank Details Section</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="showTermsAndConditionsSection"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">Show Terms & Conditions</FormLabel>
                          </FormItem>
                        )}
                      />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="button"
                      onClick={() => {
                        const currentValues = formMethods.getValues();
                        const visibilitySettings = {
                          ...loadInvoiceSettings(),
                          showCompanyGSTIN: currentValues.showCompanyGSTIN,
                          showCompanyPAN: currentValues.showCompanyPAN,
                          showCompanyPhone: currentValues.showCompanyPhone,
                          showCompanyEmail: currentValues.showCompanyEmail,
                          showCompanyStateAndCode: currentValues.showCompanyStateAndCode,
                          showCustomerGSTIN: currentValues.showCustomerGSTIN,
                          showCustomerPAN: currentValues.showCustomerPAN,
                          showCustomerStateAndCode: currentValues.showCustomerStateAndCode,
                          showHSNCodeColumn: currentValues.showHSNCodeColumn,
                          showBankDetailsSection: currentValues.showBankDetailsSection,
                          showTermsAndConditionsSection: currentValues.showTermsAndConditionsSection,
                        };
                        saveInvoiceSettings(visibilitySettings);
                        toast({
                          title: 'Visibility Settings Saved',
                          description: 'Invoice field visibility settings have been updated.',
                        });
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Visibility Settings
                    </Button>
                  </div>
                </section>
              </CardContent>
            </Card>
          </form>
        </Form>
      </FormProvider>

        {/* Export Settings Section */}
        <ExportSettings />
        <PDFSettings />
      </div>
    </div>
  );
}