'use client';

import React, { useEffect, useState } from 'react';
import { FullBillData } from '@/types/billing';
import { PDFViewer } from '@react-pdf/renderer';
import PdfInvoice from '@/components/pdf/PdfInvoice';
import { Document } from '@react-pdf/renderer';

interface ReactPdfPreviewProps {
  data: FullBillData;
}

const ReactPdfPreview: React.FC<ReactPdfPreviewProps> = ({ data }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading PDF preview...</p>
        </div>
      </div>
    );
  }

  // Ensure we have all necessary data with proper structure
  if (!data || !data.calculatedAmounts) {
    return (
      <div className="bg-white h-full p-4">
        <p className="text-red-500">Error: Missing bill data or calculated amounts</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full">
      <PDFViewer className="w-full h-full min-h-[800px]">
        <Document>
          <PdfInvoice data={data} />
        </Document>
      </PDFViewer>
    </div>
  );
};

export default ReactPdfPreview; 