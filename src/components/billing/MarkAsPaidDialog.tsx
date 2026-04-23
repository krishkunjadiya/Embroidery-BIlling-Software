
'use client';

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PaymentDetails } from '@/types/billing';
import { PaymentDetailsSchema } from '@/types/billing';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type PaymentMethod = 'cash' | 'online' | 'cheque';

interface MarkAsPaidDialogProps {
  billId: string;
  invoiceNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (billId: string, paymentDetails: PaymentDetails) => void;
}

// Combines all possible fields for the form state, ensuring defaults.
type FormValues = {
  method: PaymentMethod;
  paymentDate?: Date;
  appName?: string;
  upiId?: string;
  transactionId?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: Date;
};


export default function MarkAsPaidDialog({
  billId,
  invoiceNumber,
  open,
  onOpenChange,
  onConfirm,
}: MarkAsPaidDialogProps) {
  
  const formMethods = useForm<FormValues>({
    resolver: zodResolver(PaymentDetailsSchema) as Resolver<FormValues>,
    defaultValues: {
      method: 'cash', // Initial method
      paymentDate: new Date(),
      // Online fields
      appName: '',
      upiId: '',
      transactionId: '', 
      // Cheque fields
      bankName: '',
      chequeNumber: '',
      chequeDate: new Date(), 
    },
  });

  const { handleSubmit, control, reset, watch, getValues, formState: { errors, isSubmitting } } = formMethods;
  const watchedMethod = watch('method');

  useEffect(() => {
    if (open) {
      const currentValues = getValues(); 
      const currentPaymentDate = currentValues.paymentDate || new Date();
      
      let resetValues: FormValues = {
        method: watchedMethod || 'cash',
        paymentDate: currentPaymentDate,
        appName: '',
        upiId: '',
        transactionId: '',
        bankName: '',
        chequeNumber: '',
        chequeDate: new Date(), 
      };

      if (watchedMethod === 'online') {
        resetValues = {
          ...resetValues,
          method: 'online',
          appName: currentValues.appName || '',
          upiId: currentValues.upiId || '',
          transactionId: currentValues.transactionId || '',
        };
      } else if (watchedMethod === 'cheque') {
        resetValues = {
          ...resetValues,
          method: 'cheque',
          bankName: currentValues.bankName || '',
          chequeNumber: currentValues.chequeNumber || '',
          chequeDate: currentValues.chequeDate || new Date(),
        };
      }
      reset(resetValues, { keepValues: false, keepDirty: false, keepErrors: false, keepTouched: false, keepIsValid: false, keepSubmitCount: false });
    }
  }, [watchedMethod, open, reset, getValues]);

  const onSubmit = (data: FormValues) => {
    const paymentDataForSubmission: any = {
        method: data.method,
        paymentDate: data.paymentDate || new Date(),
    };

    if (data.method === 'online') {
        paymentDataForSubmission.appName = data.appName;
        paymentDataForSubmission.upiId = data.upiId;
        paymentDataForSubmission.transactionId = data.transactionId === '' ? undefined : data.transactionId;
    } else if (data.method === 'cheque') {
        paymentDataForSubmission.bankName = data.bankName;
        paymentDataForSubmission.chequeNumber = data.chequeNumber;
        paymentDataForSubmission.chequeDate = data.chequeDate || new Date();
    }
    
    const validationResult = PaymentDetailsSchema.safeParse(paymentDataForSubmission);
    if (validationResult.success) {
      onConfirm(billId, validationResult.data);
      onOpenChange(false); 
    } else {
      console.error("Payment details validation error:", validationResult.error.flatten().fieldErrors);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Bill {invoiceNumber} as Paid</DialogTitle>
          <DialogDescription>Select payment method and provide details.</DialogDescription>
        </DialogHeader>
        <FormProvider {...formMethods}>
          <Form {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 block">Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row items-center gap-6"
                      >
                        {[
                          { label: 'Cash', value: 'cash' as PaymentMethod },
                          { label: 'Online', value: 'online' as PaymentMethod },
                          { label: 'Cheque', value: 'cheque' as PaymentMethod },
                        ].map((option) => (
                          <label
                            key={option.value}
                            htmlFor={`payment_method_${option.value}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`payment_method_${option.value}`} />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {watchedMethod === 'online' && (
                <>
                  <FormField
                    control={control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Name</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="e.g., GPay, PhonePe" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID / Transaction Ref</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Enter UPI ID or reference" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID (Optional)</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Transaction ID" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {watchedMethod === 'cheque' && (
                <>
                  <FormField
                    control={control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Bank Name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="chequeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cheque Number</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Cheque Number" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="chequeDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Cheque Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter className="sm:justify-end pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

