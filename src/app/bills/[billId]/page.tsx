'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactPdfPreview from '@/components/billing/ReactPdfPreview';
import type { SavedBill } from '@/types/bill';
import { loadBillById } from '@/services/billService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Save, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { exportBillWithReactPdf } from '@/services/reactPdfService';
import { loadInvoiceSettings } from '@/services/invoiceSettingsService';

export default function ViewBillPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [billData, setBillData] = useState<SavedBill | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!params || !params.billId) {
      router.push('/bills');
      return;
    }
    
    const billId = params.billId as string;
    const bill = loadBillById(billId);
    if (bill) {
      setBillData(bill);
    } else {
      router.push('/bills');
    }
  }, [params, router]);

  const handleGeneratePreview = () => {
    setShowPreview(true);
  };

  const handleSavePdf = async () => {
    if (!billData) return;
    
    // Generate preview first if not already showing
    if (!showPreview) {
      setShowPreview(true);
    }
    
    const pdfBasePath = loadInvoiceSettings().pdfDownloadPath;
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
      const success = await exportBillWithReactPdf(billData);

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

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => router.push('/bills')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>View Bill</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              {!showPreview ? (
                <Button onClick={handleGeneratePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Preview
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  Hide Preview
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {billData && showPreview && (
            <ReactPdfPreview data={billData} />
          )}
          
          {billData && !showPreview && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="mb-4 text-lg">Bill #{billData.invoiceDetails.invoiceNumber} is ready for preview</p>
              <p className="mb-6 text-muted-foreground">Click "Show Preview" to view the bill</p>
              <Button onClick={handleGeneratePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (showPreview) {
                window.print();
              } else {
                setShowPreview(true);
                setTimeout(() => window.print(), 500);
              }
            }}
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleSavePdf}
            disabled={isPrinting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}