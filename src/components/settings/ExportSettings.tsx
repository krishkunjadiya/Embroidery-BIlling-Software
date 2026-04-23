'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, FileText, TrendingUp, Banknote, Calendar, Users } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadBills, filterBills } from '@/services/billService';
import { loadCustomers } from '@/services/customer';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import type { SavedBill } from '@/types/bill';
import { saveAs } from 'file-saver';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const monthName = (d: Date) => d.toLocaleString('default', { month: 'long' });
const createSafeDate = (date: Date | string | null | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  try {
    return new Date(date);
  } catch {
    return new Date();
  }
};

const formatDateSafe = (date: Date | string | null | undefined): string => {
  if (!date) return '—';
  try {
    const safeDate = createSafeDate(date);
    return format(safeDate, 'dd-MM-yyyy');
  } catch {
    return '—';
  }
};

const formatDateTimeSafe = (date: Date | string | null | undefined): string => {
  if (!date) return '—';
  try {
    const safeDate = createSafeDate(date);
    return format(safeDate, 'dd-MM-yyyy HH:mm');
  } catch {
    return '—';
  }
};

export default function ExportSettings() {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isCustomRange, setIsCustomRange] = useState(false);
  const { toast } = useToast();
  const customers = loadCustomers();

  // Generate array of years (last 10 years)
  const years = Array.from({ length: 10 }, (_, i) => 
    (new Date().getFullYear() - i).toString()
  );

  // Generate array of months
  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const handleQuickDateSelect = (period: 'today' | 'thisMonth' | 'thisYear' | 'custom' | 'allTime') => {
    const now = new Date();
    setIsCustomRange(period === 'custom');
    
    switch (period) {
      case 'today':
        setFromDate(startOfDay(now));
        setToDate(endOfDay(now));
        setSelectedMonth('all');
        setSelectedYear(now.getFullYear().toString());
        break;
      case 'thisMonth':
        setFromDate(startOfMonth(now));
        setToDate(endOfMonth(now));
        setSelectedMonth(now.getMonth().toString());
        setSelectedYear(now.getFullYear().toString());
        break;
      case 'thisYear':
        setFromDate(startOfYear(now));
        setToDate(endOfYear(now));
        setSelectedMonth('all');
        setSelectedYear(now.getFullYear().toString());
        break;
      case 'allTime':
        setFromDate(undefined);
        setToDate(undefined);
        setSelectedMonth('all');
        setSelectedYear(now.getFullYear().toString());
        break;
      case 'custom':
        setFromDate(undefined);
        setToDate(undefined);
        setSelectedMonth('all');
        setSelectedYear(now.getFullYear().toString());
        break;
    }
  };

  const handleMonthYearSelect = () => {
    if (selectedYear && selectedMonth !== 'all') {
      const date = new Date(parseInt(selectedYear), parseInt(selectedMonth));
      setFromDate(startOfMonth(date));
      setToDate(endOfMonth(date));
    } else if (selectedYear) {
      const date = new Date(parseInt(selectedYear), 0);
      setFromDate(startOfYear(date));
      setToDate(endOfYear(date));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'N/A';
    return format(new Date(date), 'PPP');
  };

  const handleExportBills = async () => {
    try {
      const bills = loadBills();
      let filteredBills = bills;

      if (fromDate || toDate || selectedCustomerId !== 'all') {
        filteredBills = filterBills(bills, {
          filterType: 'custom',
          customerId: selectedCustomerId !== 'all' ? selectedCustomerId : undefined,
          startDate: fromDate,
          endDate: toDate
        });
      }

      // Group bills by year
      const byYear: Record<string, typeof filteredBills> = {};
      filteredBills.forEach(b => {
        if (b.invoiceDetails.date) {
          const billDate = new Date(b.invoiceDetails.date);
          const y = billDate.getFullYear().toString();
          (byYear[y] ??= []).push(b);
        }
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // 1. Bills Summary sheet
      {
      const summaryData = [
          ['Bills Report'],
          ['Date Range:', fromDate && toDate ? `${formatDateSafe(fromDate)} to ${formatDateSafe(toDate)}` : 'All Time'],
        ['Customer:', selectedCustomerId !== 'all' ? customers.find(c => c.id === selectedCustomerId)?.name || 'N/A' : 'All Customers'],
          ['Generated:', formatDateTimeSafe(new Date())],
        [],
          ['Overall Summary'],
        ['Total Bills:', filteredBills.length],
          ['Total Amount:', formatCurrency(filteredBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0))],
          [],
          ['Yearly and Monthly Breakdown'],
          ['Year', 'Bills', 'Total Amount', 'Paid Amount', 'Pending Amount'],
          ...Object.entries(byYear).map(([year, bills]) => {
            const yearTotal = bills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0);
            const yearPaid = bills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0);
            return [
              year,
              bills.length,
              formatCurrency(yearTotal),
              formatCurrency(yearPaid),
              formatCurrency(yearTotal - yearPaid)
            ];
          })
        ];

        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        summaryData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) };
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Bills Summary');
      }

      // 2. Individual Year sheets
      Object.entries(byYear).forEach(([year, yearBills]) => {
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const monthBills = yearBills.filter(b => {
            const date = createSafeDate(b.invoiceDetails.date);
            return date.getMonth() === i;
          });
          const monthTotal = monthBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0);
          const monthPaid = monthBills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0);
          return [
            monthName(new Date(parseInt(year), i)),
            monthBills.length,
            formatCurrency(monthTotal),
            formatCurrency(monthPaid),
            formatCurrency(monthTotal - monthPaid)
          ];
        }).filter(row => Number(row[1]) > 0); // Only include months with bills

        const yearData = [
          [`Bills Report - Year ${year}`],
          ['Total Bills:', yearBills.length],
          ['Total Amount:', formatCurrency(yearBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0))],
          ['Paid Amount:', formatCurrency(yearBills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0))],
          ['Pending Amount:', formatCurrency(yearBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0) - yearBills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0))],
          [],
          ['Monthly Breakdown'],
          ['Month', 'Bills', 'Total Amount', 'Paid Amount', 'Pending Amount'],
          ...monthlyData,
          [],
          ['Bill Details'],
          ['Bill #', 'Date', 'Customer', 'Subtotal', 'Tax', 'Grand Total', 'Status', 'Payment Details'],
          ...yearBills.map(b => [
            b.invoiceDetails.invoiceNumber,
            formatDateSafe(b.invoiceDetails.date),
            b.billTo.name,
            formatCurrency(b.calculatedAmounts.subTotalBeforeDiscount),
            formatCurrency(b.calculatedAmounts.cgstAmount + b.calculatedAmounts.sgstAmount),
            formatCurrency(b.calculatedAmounts.grandTotal),
            b.paymentStatus,
            b.paymentDetails ? `Date: ${formatDateSafe(b.paymentDetails.paymentDate)} | ${
              b.paymentDetails.method === 'cheque'
                ? `Bank: ${b.paymentDetails.bankName}, Cheque Number: ${b.paymentDetails.chequeNumber}, Date: ${formatDateSafe(b.paymentDetails.chequeDate)}`
                : b.paymentDetails.method === 'online'
                ? `Bank: ${b.paymentDetails.appName}, UPI: ${b.paymentDetails.upiId}`
                : 'Cash'
            }` : ''
          ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(yearData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        yearData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) };
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, `Year ${year}`);
      });

      // 3. All Bills sheet
      {
        const allBillsData = [
          ['Bill Details - All Time'],
          ['Date Range:', fromDate && toDate ? `${formatDateSafe(fromDate)} to ${formatDateSafe(toDate)}` : 'All Time'],
          ['Customer:', selectedCustomerId !== 'all' ? customers.find(c => c.id === selectedCustomerId)?.name || 'N/A' : 'All Customers'],
          ['Generated:', formatDateTimeSafe(new Date())],
          [],
          ['Bill #', 'Date', 'Year', 'Month', 'Customer', 'Subtotal', 'Tax', 'Grand Total', 'Status', 'Payment Details'],
          ...filteredBills.map(b => {
            const date = createSafeDate(b.invoiceDetails.date);
            return [
              b.invoiceDetails.invoiceNumber,
              formatDateSafe(b.invoiceDetails.date),
              date.getFullYear(),
              monthName(date),
              b.billTo.name,
              formatCurrency(b.calculatedAmounts.subTotalBeforeDiscount),
              formatCurrency(b.calculatedAmounts.cgstAmount + b.calculatedAmounts.sgstAmount),
              formatCurrency(b.calculatedAmounts.grandTotal),
              b.paymentStatus,
              b.paymentDetails ? `Date: ${formatDateSafe(b.paymentDetails.paymentDate)} | ${
                b.paymentDetails.method === 'cheque'
                  ? `Bank: ${b.paymentDetails.bankName}, Cheque Number: ${b.paymentDetails.chequeNumber}, Date: ${formatDateSafe(b.paymentDetails.chequeDate)}`
                  : b.paymentDetails.method === 'online'
                  ? `Bank: ${b.paymentDetails.appName}, UPI: ${b.paymentDetails.upiId}`
                  : 'Cash'
              }` : ''
            ];
          })
        ];

        const ws = XLSX.utils.aoa_to_sheet(allBillsData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        allBillsData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) };
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'All Bills');
      }

      // 4. Bill Items sheet
      {
      const itemsData = [
          ['Bill Items Detail'],
          [],
          ['Bill #', 'Date', 'Customer', 'Item Description', 'Quantity', 'Rate', 'Amount'],
          ...filteredBills.flatMap(b => 
            b.items.map(item => [
              b.invoiceDetails.invoiceNumber,
              formatDateSafe(b.invoiceDetails.date),
              b.billTo.name,
            item.description,
            item.quantity || 0,
            formatCurrency(item.rate || 0),
            formatCurrency(item.amount)
          ])
        )
      ];

        const ws = XLSX.utils.aoa_to_sheet(itemsData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        itemsData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) };
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Bill Items');
      }

      // 5. Paid Bills sheet
      {
        const paidBills = filteredBills.filter(b => b.paymentStatus === 'paid');
        const paidBillsData = [
          ['Paid Bills'],
          ['Date Range:', fromDate && toDate ? `${formatDateSafe(fromDate)} to ${formatDateSafe(toDate)}` : 'All Time'],
          ['Customer:', selectedCustomerId !== 'all' ? customers.find(c => c.id === selectedCustomerId)?.name || 'N/A' : 'All Customers'],
          ['Generated:', formatDateTimeSafe(new Date())],
          [],
          ['Customer', 'Bill #', 'Date', 'Month', 'Subtotal', 'Tax', 'Grand Total', 'Payment Details'],
          ...paidBills.map(b => [
            b.billTo.name,
            b.invoiceDetails.invoiceNumber,
            formatDateSafe(b.invoiceDetails.date),
            monthName(createSafeDate(b.invoiceDetails.date)),
            formatCurrency(b.calculatedAmounts.subTotalBeforeDiscount),
            formatCurrency(b.calculatedAmounts.cgstAmount + b.calculatedAmounts.sgstAmount),
            formatCurrency(b.calculatedAmounts.grandTotal),
            b.paymentDetails ? `Date: ${formatDateSafe(b.paymentDetails.paymentDate)} | ${
              b.paymentDetails.method === 'cheque'
                ? `Bank: ${b.paymentDetails.bankName}, Cheque Number: ${b.paymentDetails.chequeNumber}, Date: ${formatDateSafe(b.paymentDetails.chequeDate)}`
                : b.paymentDetails.method === 'online'
                ? `Bank: ${b.paymentDetails.appName}, UPI: ${b.paymentDetails.upiId}`
                : 'Cash'
            }` : ''
          ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(paidBillsData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        paidBillsData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) };
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Paid Bills');
      }

      // 6. Pending Bills sheet
      {
        const pendingBills = filteredBills.filter(b => b.paymentStatus === 'pending');
        const pendingBillsData = [
          ['Pending Bills'],
          ['Date Range:', fromDate && toDate ? `${formatDateSafe(fromDate)} to ${formatDateSafe(toDate)}` : 'All Time'],
          ['Customer:', selectedCustomerId !== 'all' ? customers.find(c => c.id === selectedCustomerId)?.name || 'N/A' : 'All Customers'],
          ['Generated:', formatDateTimeSafe(new Date())],
          [],
          ['Customer', 'Bill #', 'Date', 'Month', 'Subtotal', 'Tax', 'Grand Total'],
          ...pendingBills.map(b => [
            b.billTo.name,
            b.invoiceDetails.invoiceNumber,
            formatDateSafe(b.invoiceDetails.date),
            monthName(createSafeDate(b.invoiceDetails.date)),
            formatCurrency(b.calculatedAmounts.subTotalBeforeDiscount),
            formatCurrency(b.calculatedAmounts.cgstAmount + b.calculatedAmounts.sgstAmount),
            formatCurrency(b.calculatedAmounts.grandTotal)
          ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(pendingBillsData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        pendingBillsData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) };
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Pending Bills');
      }

      // Save file
      const filename = `bills_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast({ title: 'Export Complete', description: 'Bills have been exported successfully.' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export bills. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleExportRevenue = async () => {
    try {
      const bills = loadBills();
      let filtered = bills;
      if (fromDate || toDate || selectedCustomerId !== 'all') {
        filtered = filterBills(bills, {
          filterType: 'custom',
          customerId: selectedCustomerId !== 'all' ? selectedCustomerId : undefined,
          startDate: fromDate ? new Date(fromDate) : undefined,
          endDate: toDate ? new Date(toDate) : undefined
        });
      }

      if (!filtered.length) {
        toast({ title: 'Nothing to export', description: 'No bills match the selected filters.' });
        return;
      }

      // Pre-calculate all stats
      const totalRevenue = filtered.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0);
      const paidBills = filtered.filter(b => b.paymentStatus === 'paid');
      const pendingBills = filtered.filter(b => b.paymentStatus === 'pending');
      const paidRevenue = paidBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0);
      const pendingRevenue = totalRevenue - paidRevenue;

      // Group bills by year and month
      const byYear: Record<string, typeof filtered> = {};
      filtered.forEach(b => {
        if (b.invoiceDetails.date) {
          const billDate = new Date(b.invoiceDetails.date);
          const y = billDate.getFullYear().toString();
          (byYear[y] ??= []).push(b);
        }
      });

      // Start workbook
      const wb = XLSX.utils.book_new();

      // Revenue Summary sheet
      {
        const summaryData = [
          ['Revenue Report'],
          ['Period Type:', fromDate || toDate ? 'Custom' : 'All Time'],
          ['Date Range:', fromDate && toDate ? `${formatDateSafe(fromDate)} to ${formatDateSafe(toDate)}` : '—'],
          ['Generated:', formatDateTimeSafe(new Date())],
          [],
          ['Overall Summary'],
          ['Total Bills:', filtered.length],
          ['Total Revenue:', totalRevenue],
          ['Paid Bills:', paidBills.length],
          ['Amount:', paidRevenue],
          ['Pending Bills:', pendingBills.length],
          ['Amount:', pendingRevenue],
          ['Average Bill Value:', totalRevenue / filtered.length],
          [],
          ['Yearly and Monthly Breakdown'],
          ['Year', 'Bills', 'Revenue', 'Average'],
          ...Object.entries(byYear).map(([year, bills]) => {
            const yearRevenue = bills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0);
            return [
              year,
              bills.length,
              yearRevenue,
              yearRevenue / bills.length
            ];
          })
        ];

        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        summaryData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) }; // Min 10, Max 50 characters
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Revenue Report');
      }

      // Individual Year sheets
      Object.entries(byYear).forEach(([year, yearBills]) => {
        const yearData = [
          [`Revenue Report - Year ${year}`],
          ['Total Bills:', yearBills.length],
          ['Total Revenue:', yearBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0)],
          ['Total Amount:', yearBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0)],
          ['Paid Amount:', yearBills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0)],
          ['Pending Amount:', yearBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0) - yearBills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0)],
          ['Average Bill Value:', yearBills.reduce((s, b) => s + b.calculatedAmounts.grandTotal, 0) / yearBills.length],
          [],
          ['Monthly Breakdown'],
          ['Month', 'Bills', 'Revenue', 'Average'],
          ...yearBills.map(b => {
            const month = monthName(createSafeDate(b.invoiceDetails.date));
            return [
              month,
              b.invoiceDetails.date ? 1 : 0,
              b.calculatedAmounts.grandTotal,
              b.calculatedAmounts.grandTotal / (b.invoiceDetails.date ? 1 : 0)
            ];
          })
        ];

        const ws = XLSX.utils.aoa_to_sheet(yearData);
        
        // Auto-adjust column widths
        const colWidths: { wch: number }[] = [];
        yearData.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) }; // Min 10, Max 50 characters
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, `Year ${year}`);
      });

      // Paid Bills sheet
      {
        const ws = XLSX.utils.aoa_to_sheet([
          ['Paid Bills'],
          ['Date Range:', fromDate && toDate ? `${format(fromDate, 'dd-MM-yyyy')} to ${format(toDate, 'dd-MM-yyyy')}` : 'All Time'],
          ['Customer:', selectedCustomerId !== 'all' ? customers.find(c => c.id === selectedCustomerId)?.name || 'N/A' : 'All Customers'],
          ['Generated:', format(new Date(), 'dd-MM-yyyy HH:mm')],
          [],
          ['Bill #', 'Date', 'Month', 'Subtotal', 'Tax', 'Grand Total', 'Payment Details'],
          ...paidBills.map(b => {
            const month = monthName(createSafeDate(b.invoiceDetails.date));
            return [
              b.invoiceDetails.invoiceNumber,
              format(createSafeDate(b.invoiceDetails.date), 'dd-MM-yyyy'),
              month,
              b.calculatedAmounts.subTotalBeforeDiscount,
              b.calculatedAmounts.cgstAmount + b.calculatedAmounts.sgstAmount,
              b.calculatedAmounts.grandTotal,
              b.paymentDetails
                ? `Date: ${format(createSafeDate(b.paymentDetails.paymentDate), 'dd-MM-yyyy')} | ${
                    b.paymentDetails.method === 'cheque'
                      ? `Bank: ${b.paymentDetails.bankName}, Cheque Number: ${b.paymentDetails.chequeNumber}`
                      : b.paymentDetails.method === 'online'
                      ? `Bank: ${b.paymentDetails.appName}, UPI: ${b.paymentDetails.upiId}`
                      : 'Cash'
                  }`
                : ''
            ];
          })
        ]);
        XLSX.utils.book_append_sheet(wb, ws, 'Paid Bills');
      }

      // Pending Bills sheet
      {
        const ws = XLSX.utils.aoa_to_sheet([
          ['Pending Bills'],
          ['Date Range:', fromDate && toDate ? `${format(fromDate, 'dd-MM-yyyy')} to ${format(toDate, 'dd-MM-yyyy')}` : 'All Time'],
          ['Customer:', selectedCustomerId !== 'all' ? customers.find(c => c.id === selectedCustomerId)?.name || 'N/A' : 'All Customers'],
          ['Generated:', format(new Date(), 'dd-MM-yyyy HH:mm')],
          [],
          ['Bill #', 'Date', 'Month', 'Subtotal', 'Tax', 'Grand Total', 'Age (Days)'],
          ...pendingBills.map(b => {
            const month = monthName(createSafeDate(b.invoiceDetails.date));
            const billDate = createSafeDate(b.invoiceDetails.date);
            const age = Math.floor((new Date().getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
            return [
              b.invoiceDetails.invoiceNumber,
              format(createSafeDate(b.invoiceDetails.date), 'dd-MM-yyyy'),
              month,
              b.calculatedAmounts.subTotalBeforeDiscount,
              b.calculatedAmounts.cgstAmount + b.calculatedAmounts.sgstAmount,
              b.calculatedAmounts.grandTotal,
              age
            ];
          })
        ]);
        XLSX.utils.book_append_sheet(wb, ws, 'Pending Bills');
      }

      // Save workbook
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const now = new Date();
      saveAs(new Blob([buffer]), `revenue_report_${format(now, 'yyyyMMdd_HHmmss')}.xlsx`);
      toast({ title: 'Export Complete', description: 'Revenue report has been exported successfully.' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export revenue report. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleExportPayments = async () => {
    try {
      const bills = loadBills();
      let filteredBills = bills;

      if (fromDate || toDate || selectedCustomerId !== 'all') {
        filteredBills = filterBills(bills, {
          filterType: 'custom',
          customerId: selectedCustomerId !== 'all' ? selectedCustomerId : undefined,
          startDate: fromDate,
          endDate: toDate
        });
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // 1. All Payments Sheet
      const allPaymentsData = [
        ['Complete Payment Report'],
        ['Period: All Time'],
        ['Customer: All'],
        [],
        ['Date', 'Customer', 'Bill Number', 'Amount', 'Status', 'Payment Date', 'Payment Details'],
        ...filteredBills.map(bill => [
          formatDate(bill.invoiceDetails.date),
          bill.billTo.name,
          bill.invoiceDetails.invoiceNumber,
          formatCurrency(bill.calculatedAmounts.grandTotal),
          bill.paymentStatus,
          bill.paymentDetails?.paymentDate ? formatDate(bill.paymentDetails.paymentDate) : '',
          bill.paymentDetails ? 
            bill.paymentDetails.method === 'online' ? 
              `Bank: ${bill.paymentDetails.appName}, UPI ID: ${bill.paymentDetails.upiId}, Date: ${formatDate(bill.paymentDetails.paymentDate)}` :
            bill.paymentDetails.method === 'cheque' ?
              `Bank: ${bill.paymentDetails.bankName}, Cheque Number: ${bill.paymentDetails.chequeNumber}, Date: ${formatDate(bill.paymentDetails.chequeDate)}` :
            'Cash' : ''
        ]),
        [],
        ['Summary'],
        ['Total Bills:', filteredBills.length],
        ['Total Amount:', formatCurrency(filteredBills.reduce((sum, bill) => sum + bill.calculatedAmounts.grandTotal, 0))],
        ['Paid Bills:', filteredBills.filter(bill => bill.paymentStatus === 'paid').length, 'Amount:', 
          formatCurrency(filteredBills.filter(bill => bill.paymentStatus === 'paid')
            .reduce((sum, bill) => sum + bill.calculatedAmounts.grandTotal, 0))],
        ['Pending Bills:', filteredBills.filter(bill => bill.paymentStatus === 'pending').length, 'Amount:',
          formatCurrency(filteredBills.filter(bill => bill.paymentStatus === 'pending')
            .reduce((sum, bill) => sum + bill.calculatedAmounts.grandTotal, 0))],
        [],
        ['Note: See customer-specific sheets and Paid/Pending Bills sheets for detailed reports.']
      ];

      // 2. Paid Bills Sheet
      const paidBills = filteredBills.filter(bill => bill.paymentStatus === 'paid');
      const paidBillsData = [
        ['Paid Bills'],
        ['Date Range:', 'All Time'],
        ['Customer:', 'All Customers'],
        ['Generated:', format(new Date(), 'dd-MM-yyyy HH:mm')],
        [],
        ['Bill #', 'Date', 'Customer', 'Subtotal', 'Tax', 'Grand Total', 'Payment Date', 'Payment Details'],
        ...paidBills.map(bill => [
          bill.invoiceDetails.invoiceNumber,
          formatDate(bill.invoiceDetails.date),
          bill.billTo.name,
          formatCurrency(bill.calculatedAmounts.subTotalBeforeDiscount),
          formatCurrency(bill.calculatedAmounts.cgstAmount + bill.calculatedAmounts.sgstAmount),
          formatCurrency(bill.calculatedAmounts.grandTotal),
          bill.paymentDetails?.paymentDate ? formatDate(bill.paymentDetails.paymentDate) : '',
          bill.paymentDetails ? 
            bill.paymentDetails.method === 'online' ? 
              `Bank: ${bill.paymentDetails.appName}, UPI ID: ${bill.paymentDetails.upiId}, Date: ${formatDate(bill.paymentDetails.paymentDate)}` :
            bill.paymentDetails.method === 'cheque' ?
              `Bank: ${bill.paymentDetails.bankName}, Cheque Number: ${bill.paymentDetails.chequeNumber}, Date: ${formatDate(bill.paymentDetails.chequeDate)}` :
            'Cash' : ''
        ])
      ];

      // 3. Pending Bills Sheet
      const pendingBills = filteredBills.filter(bill => bill.paymentStatus === 'pending');
      const pendingBillsData = [
        ['Pending Bills'],
        ['Date Range:', 'All Time'],
        ['Customer:', 'All Customers'],
        ['Generated:', format(new Date(), 'dd-MM-yyyy HH:mm')],
        [],
        ['Bill #', 'Date', 'Customer', 'Subtotal', 'Tax', 'Grand Total', 'Age (Days)'],
        ...pendingBills.map(bill => [
          bill.invoiceDetails.invoiceNumber,
          formatDate(bill.invoiceDetails.date),
          bill.billTo.name,
          formatCurrency(bill.calculatedAmounts.subTotalBeforeDiscount),
          formatCurrency(bill.calculatedAmounts.cgstAmount + bill.calculatedAmounts.sgstAmount),
          formatCurrency(bill.calculatedAmounts.grandTotal),
          bill.invoiceDetails.date ? 
            Math.floor((new Date().getTime() - new Date(bill.invoiceDetails.date).getTime()) / (1000 * 60 * 60 * 24)) : 
            'N/A'
        ])
      ];

      // 4. Individual Customer Sheets
      const customerGroups = filteredBills.reduce<Record<string, { name: string, bills: SavedBill[] }>>((groups, bill) => {
        const customerName = bill.billTo.name;
        if (!groups[customerName]) {
          groups[customerName] = {
            name: customerName,
            bills: []
          };
        }
        groups[customerName].bills.push(bill);
        return groups;
      }, {});

      // Add sheets to workbook with formatting
      const addSheetWithFormatting = (name: string, data: any[][], boldRows: number[] = []) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Apply bold formatting to specified rows
        boldRows.forEach(rowIndex => {
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const addr = XLSX.utils.encode_cell({ r: rowIndex, c: C });
            if (!ws[addr]) continue;
            if (!ws[addr].s) ws[addr].s = {};
            ws[addr].s.font = { bold: true };
          }
        });

        // Auto-adjust column widths based on content
        const colWidths: { wch: number }[] = [];
        data.forEach(row => {
          row.forEach((cell, colIndex) => {
            const cellContent = cell === null || cell === undefined ? '' : String(cell);
            const contentLength = cellContent.length;
            
            if (!colWidths[colIndex] || (typeof contentLength === 'number' && contentLength > colWidths[colIndex].wch)) {
              colWidths[colIndex] = { wch: Math.min(Math.max(contentLength, 10), 50) }; // Min 10, Max 50 characters
            }
          });
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, ws, name);
      };

      // Add all sheets with proper formatting
      addSheetWithFormatting('All Payments', allPaymentsData, [0, 1, 2, 4, 8]);
      addSheetWithFormatting('Paid Bills', paidBillsData, [0, 5]);
      addSheetWithFormatting('Pending Bills', pendingBillsData, [0, 5]);

      // Add individual customer sheets
      Object.values(customerGroups).forEach(({ name, bills }) => {
        const customerData = [
          [`Payment Report - ${name}`],
          ['Period: All Time'],
          [],
          ['Date', 'Bill Number', 'Amount', 'Status', 'Payment Date', 'Payment Details'],
          ...bills.map(bill => [
            formatDate(bill.invoiceDetails.date),
            bill.invoiceDetails.invoiceNumber,
            formatCurrency(bill.calculatedAmounts.grandTotal),
            bill.paymentStatus,
            bill.paymentDetails?.paymentDate ? formatDate(bill.paymentDetails.paymentDate) : '',
            bill.paymentDetails ? 
              bill.paymentDetails.method === 'online' ? 
                `Bank: ${bill.paymentDetails.appName}, UPI ID: ${bill.paymentDetails.upiId}, Date: ${formatDate(bill.paymentDetails.paymentDate)}` :
              bill.paymentDetails.method === 'cheque' ?
                `Bank: ${bill.paymentDetails.bankName}, Cheque Number: ${bill.paymentDetails.chequeNumber}, Date: ${formatDate(bill.paymentDetails.chequeDate)}` :
              'Cash' : ''
          ]),
          [],
          ['Total:', formatCurrency(bills.reduce((sum, bill) => sum + bill.calculatedAmounts.grandTotal, 0))],
          ['Paid:', formatCurrency(bills.filter(b => b.paymentStatus === 'paid')
            .reduce((sum, bill) => sum + bill.calculatedAmounts.grandTotal, 0))],
          ['Pending:', formatCurrency(bills.filter(b => b.paymentStatus === 'pending')
            .reduce((sum, bill) => sum + bill.calculatedAmounts.grandTotal, 0))]
        ];
        addSheetWithFormatting(name, customerData, [0, 3, 7, 8, 9]);
      });

      // Save file
      const filename = `payment_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast({ title: 'Export Complete', description: 'Payment report has been exported successfully.' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export payments report. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Export Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Quick Date Selection */}
          <div className="flex flex-wrap gap-2 justify-start">
            <Button 
              variant="outline" 
              onClick={() => handleQuickDateSelect('today')}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleQuickDateSelect('thisMonth')}
            >
              This Month
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleQuickDateSelect('thisYear')}
            >
              This Year
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleQuickDateSelect('allTime')}
            >
              All Time
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleQuickDateSelect('custom')}
            >
              Custom Range
            </Button>
          </div>

          {/* Month and Year Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Select Year</label>
              <Select value={selectedYear} onValueChange={(value) => {
                setSelectedYear(value);
                handleMonthYearSelect();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Select Month</label>
              <Select value={selectedMonth} onValueChange={(value) => {
                setSelectedMonth(value);
                handleMonthYearSelect();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Customer</label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {isCustomRange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">From Date</label>
              <DatePicker date={fromDate} setDate={setFromDate} />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <DatePicker date={toDate} setDate={setToDate} />
            </div>
          </div>
          )}

          {/* Export Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleExportBills} variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Export Bills
            </Button>
            <Button onClick={handleExportRevenue} variant="outline" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              Export Revenue Report
            </Button>
            <Button onClick={handleExportPayments} variant="outline" className="w-full">
              <Banknote className="mr-2 h-4 w-4" />
              Export Payment Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 