
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SavedBill } from '@/types/bill';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewPaymentDetailsDialogProps {
  bill: SavedBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewPaymentDetailsDialog({ bill, open, onOpenChange }: ViewPaymentDetailsDialogProps) {
  if (!bill || !bill.paymentDetails) {
    return null;
  }

  const { paymentDetails, invoiceDetails } = bill;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Details for Bill {invoiceDetails.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Details of the payment received for this bill.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
          <div className="space-y-3 py-4 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Payment Method:</span>
              <span className="capitalize">{paymentDetails.method}</span>
            </div>
            {paymentDetails.paymentDate && (
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Payment Date:</span>
                <span>{format(new Date(paymentDetails.paymentDate), 'PPP')}</span>
              </div>
            )}

            {paymentDetails.method === 'online' && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">App Name:</span>
                  <span>{paymentDetails.appName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">UPI ID / Ref:</span>
                  <span>{paymentDetails.upiId}</span>
                </div>
                {paymentDetails.transactionId && (
                   <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Transaction ID:</span>
                    <span>{paymentDetails.transactionId}</span>
                  </div>
                )}
              </>
            )}

            {paymentDetails.method === 'cheque' && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Bank Name:</span>
                  <span>{paymentDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Cheque Number:</span>
                  <span>{paymentDetails.chequeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Cheque Date:</span>
                  <span>{format(new Date(paymentDetails.chequeDate), 'PPP')}</span>
                </div>
              </>
            )}
             <div className="flex justify-between pt-2 border-t mt-2">
              <span className="font-semibold text-primary">Amount Paid:</span>
              <span className="font-semibold text-primary">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(bill.calculatedAmounts.grandTotal)}
              </span>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
