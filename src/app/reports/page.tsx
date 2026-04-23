'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, CalendarDays, LineChart, Banknote, FileText, CheckCircle, XCircle, Calendar as CalendarIcon, Search, Clock, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { loadBills, filterBills, updateBillPaymentStatus } from '@/services/billService';
import type { SavedBill, PaymentDetails } from '@/types/bill';
import type { Customer } from '@/types/customer';
import { loadCustomers } from '@/services/customer';
import { cn, formatCurrency } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import ViewPaymentDetailsDialog from '@/components/reports/ViewPaymentDetailsDialog'; 
import MarkAsPaidDialog from '@/components/billing/MarkAsPaidDialog';

type PredefinedPeriod = 'today' | 'thisMonth' | 'thisYear' | 'last7Days' | 'last30Days' | 'last90Days' | 'last12Months' | 'allTime';
type Period = PredefinedPeriod | 'custom';
type ActiveReport = 'revenue' | 'payment' | null;
type CustomFilterMode = 'dateRange' | 'monthYear' | 'yearOnly';

interface MetricData {
  amount: number;
  billCount: number;
}

const calculateMetrics = (bills: SavedBill[], startDate?: Date, endDate?: Date, status?: 'paid' | 'pending' | 'partial'): MetricData => {
  const filteredByDate = filterBills(bills, {
    filterType: 'custom', 
    startDate,
    endDate,
  });
  
  const finalFilteredBills = status ? filteredByDate.filter(bill => bill.paymentStatus === status) : filteredByDate;

  const amount = finalFilteredBills.reduce((total, bill) => total + bill.calculatedAmounts.grandTotal, 0);
  return { amount, billCount: finalFilteredBills.length };
};

export default function ReportsPage() {
  const [allBills, setAllBills] = useState<SavedBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today'); // Default to 'today'
  
  const [customFromDate, setCustomFromDate] = useState<Date | undefined>(undefined);
  const [customToDate, setCustomToDate] = useState<Date | undefined>(undefined);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined); // customerId for filtering
  const [customFilterMode, setCustomFilterMode] = useState<CustomFilterMode>('dateRange');
  const [customMonth, setCustomMonth] = useState<string | undefined>(undefined); 
  const [customYearForMonth, setCustomYearForMonth] = useState<number | undefined>(new Date().getFullYear());
  const [customYearOnly, setCustomYearOnly] = useState<number | undefined>(new Date().getFullYear());

  const [activeReport, setActiveReport] = useState<ActiveReport>(null);
  const [billToViewPaymentDetails, setBillToViewPaymentDetails] = useState<SavedBill | null>(null);
  const [billToMarkPaid, setBillToMarkPaid] = useState<{ billId: string, invoiceNumber: string } | null>(null);
  const [billToMarkPending, setBillToMarkPending] = useState<{bill: SavedBill} | null>(null);

  const { toast } = useToast();

  const fetchBillsAndCustomers = useCallback(() => {
    setIsLoading(true);
    const loadedBills = loadBills();
    const loadedCustomers = loadCustomers();
    setAllBills(loadedBills);
    setCustomers(loadedCustomers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBillsAndCustomers();
  }, [fetchBillsAndCustomers]);

  const getPeriodDates = useCallback((
    period: Period,
    from?: Date,
    to?: Date,
    mode?: CustomFilterMode,
    month?: string, 
    yearForMonth?: number,
    yearOnly?: number
  ): { start?: Date, end?: Date } => {
    const now = new Date();
    switch (period) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'thisMonth': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'thisYear': return { start: startOfYear(now), end: endOfYear(now) };
      case 'last7Days': return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case 'last30Days': return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
      case 'last90Days': return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };
      case 'last12Months': return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
      case 'custom':
        if (mode === 'monthYear' && month !== undefined && yearForMonth !== undefined) {
          const monthIndex = parseInt(month, 10);
          if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11) {
            const S = startOfMonth(new Date(yearForMonth, monthIndex, 1));
            const E = endOfMonth(new Date(yearForMonth, monthIndex, 1));
            return { start: S, end: E };
          }
        } else if (mode === 'yearOnly' && yearOnly !== undefined) {
          const S = startOfYear(new Date(yearOnly, 0, 1));
          const E = endOfYear(new Date(yearOnly, 11, 31));
          return { start: S, end: E };
        }
        return { start: from ? startOfDay(from) : undefined, end: to ? endOfDay(to) : undefined };
      case 'allTime': 
      default:
        if (allBills.length > 0 && allBills.every(b => b.invoiceDetails.date)) { 
            const earliestBill = allBills.reduce((earliest, current) => 
                new Date(current.invoiceDetails.date!) < new Date(earliest.invoiceDetails.date!) ? current : earliest
            );
            return { start: startOfDay(new Date(earliestBill.invoiceDetails.date!)), end: endOfDay(now) };
        }
        return { start: undefined, end: undefined }; 
    }
  }, [allBills]); 

  const { start: currentStartDate, end: currentEndDate } = getPeriodDates(
    selectedPeriod,
    customFromDate,
    customToDate,
    selectedPeriod === 'custom' ? customFilterMode : undefined,
    selectedPeriod === 'custom' && customFilterMode === 'monthYear' ? customMonth : undefined,
    selectedPeriod === 'custom' && customFilterMode === 'monthYear' ? customYearForMonth : undefined,
    selectedPeriod === 'custom' && customFilterMode === 'yearOnly' ? customYearOnly : undefined
  );
  
  const revenueData = isLoading ? { amount: 0, billCount: 0 } : calculateMetrics(allBills, currentStartDate, currentEndDate);
  const paidBillsData = isLoading ? { amount: 0, billCount: 0 } : calculateMetrics(allBills, currentStartDate, currentEndDate, 'paid');
  const pendingBillsData = isLoading ? { amount: 0, billCount: 0 } : calculateMetrics(allBills, currentStartDate, currentEndDate, 'pending');
  
  const displayedAllBillsForPeriod = isLoading ? [] : filterBills(allBills, { filterType: 'custom', startDate: currentStartDate, endDate: currentEndDate, paymentStatus: 'all', customerId: selectedCustomerId });
  const displayedPaidBills = isLoading ? [] : filterBills(allBills, { filterType: 'custom', startDate: currentStartDate, endDate: currentEndDate, paymentStatus: 'paid', customerId: selectedCustomerId});
  const displayedPendingBills = isLoading ? [] : filterBills(allBills, { filterType: 'custom', startDate: currentStartDate, endDate: currentEndDate, paymentStatus: 'pending', customerId: selectedCustomerId});


  const periodLabels: Record<Period, string> = {
    'today': 'Today', 'thisMonth': 'This Month', 'thisYear': 'This Year',
    'last7Days': 'Last 7 Days', 'last30Days': 'Last 30 Days', 'last90Days': 'Last 90 Days', 'last12Months': 'Last 12 Months',
    'allTime': 'All Time', 'custom': 'Custom Period'
  };

  const getDisplayPeriodLabel = () => {
    if (selectedPeriod === 'custom') {
      if (customFilterMode === 'monthYear' && customMonth !== undefined && customYearForMonth !== undefined) {
        const monthName = format(new Date(customYearForMonth, parseInt(customMonth)), 'MMMM');
        return `Custom: ${monthName} ${customYearForMonth}`;
      } else if (customFilterMode === 'yearOnly' && customYearOnly !== undefined) {
        return `Custom: Year ${customYearOnly}`;
      } else if (customFilterMode === 'dateRange') {
        if (customFromDate && customToDate) return `Custom: ${format(customFromDate, 'dd-MMM-yyyy')} - ${format(customToDate, 'dd-MMM-yyyy')}`;
        if (customFromDate) return `Custom: From ${format(customFromDate, 'dd-MMM-yyyy')}`;
        if (customToDate) return `Custom: Up to ${format(customToDate, 'dd-MMM-yyyy')}`;
      }
      return 'Custom Period (Select details)';
    }
    return periodLabels[selectedPeriod];
  };

  const handleApplyCustomFilters = () => {
    // This function applies the custom date/month/year period. Customer filter applies reactively.
    if (selectedPeriod !== 'custom') { // Should not happen if button is only shown for custom
        setSelectedPeriod('custom');
    }
    toast({title: "Custom Period Applied", description: `Displaying report for ${getDisplayPeriodLabel()}`});
  };
  
  const clearCustomFilters = () => { // Renamed to clearAllFilters for clarity
    setCustomFromDate(undefined);
    setCustomToDate(undefined);
    setSelectedCustomerId(undefined); // Clear customer filter as well
    setCustomFilterMode('dateRange');
    setCustomMonth(undefined);
    setCustomYearForMonth(new Date().getFullYear());
    setCustomYearOnly(new Date().getFullYear());
    setSelectedPeriod('today'); // Default to 'today' when clearing filters
    toast({title: "All Filters Cleared"});
  };


  const handleConfirmMarkAsPaid = (billId: string, paymentDetails: PaymentDetails) => {
    const updatedBill = updateBillPaymentStatus(billId, 'paid', paymentDetails);
    if (updatedBill) {
      fetchBillsAndCustomers(); 
      toast({
        title: 'Payment Status Updated',
        description: `Bill ${updatedBill.invoiceDetails.invoiceNumber} marked as paid.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update payment status.',
        variant: 'destructive',
      });
    }
    setBillToMarkPaid(null);
  };

  const handleConfirmMarkAsPending = () => {
    if (billToMarkPending) {
      const updatedBill = updateBillPaymentStatus(billToMarkPending.bill.id, 'pending');
      if (updatedBill) {
        fetchBillsAndCustomers(); 
        toast({
          title: 'Payment Status Updated',
          description: `Bill ${updatedBill.invoiceDetails.invoiceNumber} marked as pending.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update payment status.',
          variant: 'destructive',
        });
      }
      setBillToMarkPending(null);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    if (document.activeElement === event.currentTarget) {
      event.currentTarget.blur();
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Reports</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Button
          onClick={() => setActiveReport('revenue')}
          variant={activeReport === 'revenue' ? 'default' : 'outline'}
          className="w-full md:w-auto"
        >
          <LineChart className="mr-2 h-5 w-5" /> Revenue Report
        </Button>
        <Button
          onClick={() => setActiveReport('payment')}
          variant={activeReport === 'payment' ? 'default' : 'outline'}
          className="w-full md:w-auto"
        >
          <Banknote className="mr-2 h-5 w-5" /> Payment Report
        </Button>
      </div>

      {activeReport === null && (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" data-ai-hint="document report"/>
          <p>Select a report type above to view details.</p>
        </div>
      )}

      {(activeReport === 'revenue' || activeReport === 'payment') && (
        <Card className="shadow-lg w-full mb-8">
            <CardHeader>
                <CardTitle className="text-lg text-primary">Select Report Period & Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                    {(['today', 'last7Days', 'thisMonth', 'last30Days', 'last90Days', 'thisYear', 'last12Months', 'allTime', 'custom'] as Period[]).map(p => (
                        <Button
                            key={p}
                            variant={selectedPeriod === p ? 'default' : 'outline'}
                            onClick={() => {
                                setSelectedPeriod(p);
                                if (p !== 'custom') { // If not custom, custom date fields are not primary
                                   setCustomFromDate(undefined);
                                   setCustomToDate(undefined);
                                   setCustomMonth(undefined);
                                   setCustomYearForMonth(new Date().getFullYear());
                                   setCustomYearOnly(new Date().getFullYear());
                                   setCustomFilterMode('dateRange');
                                }
                            }}
                        >
                            {periodLabels[p]}
                        </Button>
                    ))}
                </div>

                {selectedPeriod === 'custom' && (
                    <div className="border-t pt-6 space-y-6">
                        <h3 className="text-md font-semibold text-muted-foreground">Custom Period Options</h3>
                        <div className="space-y-2">
                            <Label>Filter by:</Label>
                            <RadioGroup
                                value={customFilterMode}
                                onValueChange={(value) => setCustomFilterMode(value as CustomFilterMode)}
                                className="flex flex-col sm:flex-row gap-2 sm:gap-4"
                            >
                                <div className="flex items-center space-x-2"><RadioGroupItem value="dateRange" id="rDateRange" /><Label htmlFor="rDateRange">Date Range</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="monthYear" id="rMonthYear" /><Label htmlFor="rMonthYear">Month & Year</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="yearOnly" id="rYearOnly" /><Label htmlFor="rYearOnly">Year</Label></div>
                            </RadioGroup>
                        </div>

                        {customFilterMode === 'dateRange' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-1">
                                    <Label htmlFor="customFromDate">From Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id="customFromDate" variant="outline" className={cn("w-full justify-start text-left font-normal", !customFromDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {customFromDate ? format(customFromDate, "PPP") : <span>Pick a start date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customFromDate} onSelect={setCustomFromDate} initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="customToDate">To Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id="customToDate" variant="outline" className={cn("w-full justify-start text-left font-normal", !customToDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {customToDate ? format(customToDate, "PPP") : <span>Pick an end date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customToDate} onSelect={setCustomToDate} disabled={(date) => customFromDate ? date < customFromDate : false} initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}

                        {customFilterMode === 'monthYear' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-1">
                                    <Label htmlFor="customMonth">Month</Label>
                                    <Select value={customMonth} onValueChange={setCustomMonth}>
                                        <SelectTrigger id="customMonth"><SelectValue placeholder="Select Month" /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }).map((_, i) => (<SelectItem key={i} value={String(i)}>{format(new Date(2000, i, 1), 'MMMM')}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="customYearForMonth">Year</Label>
                                    <Input 
                                      id="customYearForMonth" 
                                      type="number" 
                                      placeholder="YYYY" 
                                      value={customYearForMonth || ''} 
                                      onChange={(e) => setCustomYearForMonth(e.target.value ? parseInt(e.target.value) : undefined)} 
                                      onWheel={handleWheel}
                                    />
                                </div>
                            </div>
                        )}

                        {customFilterMode === 'yearOnly' && (
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 items-end"> 
                                <div className="space-y-1">
                                    <Label htmlFor="customYearOnly">Year</Label>
                                    <Input 
                                      id="customYearOnly" 
                                      type="number" 
                                      placeholder="YYYY" 
                                      value={customYearOnly || ''} 
                                      onChange={(e) => setCustomYearOnly(e.target.value ? parseInt(e.target.value) : undefined)} 
                                      onWheel={handleWheel}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="space-y-1 pt-4 border-t mt-4">
                    <Label htmlFor="customerNameReportFilter">Customer Name (Optional)</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger id="customerNameReportFilter" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Filter by Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_customers">All Customers</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
                    <Button variant="outline" onClick={clearCustomFilters}>Clear All Filters</Button>
                    {selectedPeriod === 'custom' && (
                        <Button onClick={handleApplyCustomFilters} className="bg-primary hover:bg-primary/90">
                            <Search className="mr-2 h-4 w-4" /> Apply Custom Period
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      )}


      {activeReport === 'revenue' && (
        <Card className="shadow-lg w-full">
          <CardHeader>
            <div>
                <CardTitle className="text-xl font-semibold text-primary">
                <TrendingUp className="inline-block mr-2 h-5 w-5 text-accent" />
                 Revenue Report for {getDisplayPeriodLabel()}
                 {selectedCustomerId && selectedCustomerId !== 'all_customers' && customers.find(c=>c.id === selectedCustomerId) && 
                    ` (Customer: ${customers.find(c=>c.id === selectedCustomerId)?.name})`}
                </CardTitle>
                <CardDescription>Overview of revenue generated and bills issued.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">Loading revenue data...</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center border-b pb-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Revenue ({getDisplayPeriodLabel()})</p>
                        <p className="text-4xl font-bold text-accent">{formatCurrency(revenueData.amount)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Number of Bills ({getDisplayPeriodLabel()})</p>
                        <p className="text-4xl font-bold text-accent">{revenueData.billCount}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <Card className="p-4 bg-card shadow-sm">
                        <CardHeader className="p-0 pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground">Today</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-lg font-semibold">{formatCurrency(calculateMetrics(allBills, getPeriodDates('today').start, getPeriodDates('today').end).amount)}</p>
                            <p className="text-xs text-muted-foreground">{calculateMetrics(allBills, getPeriodDates('today').start, getPeriodDates('today').end).billCount} bills</p>
                        </CardContent>
                    </Card>
                     <Card className="p-4 bg-card shadow-sm">
                        <CardHeader className="p-0 pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground">This Month</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-lg font-semibold">{formatCurrency(calculateMetrics(allBills, getPeriodDates('thisMonth').start, getPeriodDates('thisMonth').end).amount)}</p>
                            <p className="text-xs text-muted-foreground">{calculateMetrics(allBills, getPeriodDates('thisMonth').start, getPeriodDates('thisMonth').end).billCount} bills</p>
                        </CardContent>
                    </Card>
                     <Card className="p-4 bg-card shadow-sm">
                        <CardHeader className="p-0 pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground">This Year</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-lg font-semibold">{formatCurrency(calculateMetrics(allBills, getPeriodDates('thisYear').start, getPeriodDates('thisYear').end).amount)}</p>
                            <p className="text-xs text-muted-foreground">{calculateMetrics(allBills, getPeriodDates('thisYear').start, getPeriodDates('thisYear').end).billCount} bills</p>
                        </CardContent>
                    </Card>
                </div>
                 <p className="text-xs text-muted-foreground text-center pt-2">
                    Revenue calculated from grand total of saved bills within the selected period.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeReport === 'payment' && (
        <div className="space-y-8">
            <Card className="shadow-lg w-full">
                <CardHeader>
                    <div>
                        <CardTitle className="text-xl font-semibold text-primary">
                        <DollarSign className="inline-block mr-2 h-5 w-5 text-accent" />
                        Payment Summary for {getDisplayPeriodLabel()}
                        {selectedCustomerId && selectedCustomerId !== 'all_customers' && customers.find(c=>c.id === selectedCustomerId) && 
                            ` (Customer: ${customers.find(c=>c.id === selectedCustomerId)?.name})`}
                        </CardTitle>
                        <CardDescription>Track received payments and outstanding invoices for the selected period and customer.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="text-center py-10 text-muted-foreground">Loading payment data...</div>
                        ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                                <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base font-medium text-green-700 dark:text-green-300">Total Payments Received</CardTitle>
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400"/>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(paidBillsData.amount)}</p>
                                    <p className="text-xs text-green-500 dark:text-green-400/80">{paidBillsData.billCount} bills paid</p>
                                </CardContent>
                            </Card>
                             <Card className="p-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
                                <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base font-medium text-red-700 dark:text-red-300">Total Outstanding</CardTitle>
                                     <XCircle className="h-5 w-5 text-red-600 dark:text-red-400"/>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(pendingBillsData.amount)}</p>
                                    <p className="text-xs text-red-500 dark:text-red-400/80">{pendingBillsData.billCount} bills pending</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg w-full">
                <CardHeader>
                    <CardTitle className="text-lg text-primary">Paid Bills ({getDisplayPeriodLabel()}{selectedCustomerId && selectedCustomerId !== 'all_customers' && customers.find(c=>c.id === selectedCustomerId) ? `, ${customers.find(c=>c.id === selectedCustomerId)?.name}` : ''})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <p>Loading...</p> : displayedPaidBills.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>Inv. No.</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {displayedPaidBills.map(bill => (
                                    <TableRow key={bill.id}>
                                        <TableCell><Link href={`/bills/${bill.id}`} className="text-primary hover:underline">{bill.invoiceDetails.invoiceNumber}</Link></TableCell>
                                        <TableCell>{bill.invoiceDetails.date ? format(new Date(bill.invoiceDetails.date), 'dd-MMM-yyyy') : 'N/A'}</TableCell>
                                        <TableCell>{bill.billTo.name}</TableCell>
                                        <TableCell>
                                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                                            {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(bill.calculatedAmounts.grandTotal)}</TableCell>
                                        <TableCell className="text-center space-x-1">
                                            {bill.paymentDetails && (
                                                <Button variant="ghost" size="icon" onClick={() => setBillToViewPaymentDetails(bill)} className="text-blue-600 hover:text-blue-700 border-blue-500 hover:border-blue-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => setBillToMarkPending({bill})} className="text-yellow-600 hover:text-yellow-700">
                                                        <Clock className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle><AlertDialogDescription>Mark bill {bill.invoiceDetails.invoiceNumber} as pending?</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel onClick={() => setBillToMarkPending(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmMarkAsPending} className="bg-yellow-600 hover:bg-yellow-700 text-white">Confirm</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : <p className="text-muted-foreground text-center py-4">No paid bills in this period{selectedCustomerId && selectedCustomerId !== 'all_customers' ? ' for the selected customer' : ''}.</p>}
                </CardContent>
            </Card>
            
            <Card className="shadow-lg w-full">
                <CardHeader>
                    <CardTitle className="text-lg text-primary">Pending Bills ({getDisplayPeriodLabel()}{selectedCustomerId && selectedCustomerId !== 'all_customers' && customers.find(c=>c.id === selectedCustomerId) ? `, ${customers.find(c=>c.id === selectedCustomerId)?.name}` : ''})</CardTitle>
                </CardHeader>
                <CardContent>
                     {isLoading ? <p>Loading...</p> : displayedPendingBills.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>Inv. No.</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-center">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {displayedPendingBills.map(bill => (
                                    <TableRow key={bill.id}>
                                        <TableCell><Link href={`/bills/${bill.id}`} className="text-primary hover:underline">{bill.invoiceDetails.invoiceNumber}</Link></TableCell>
                                        <TableCell>{bill.invoiceDetails.date ? format(new Date(bill.invoiceDetails.date), 'dd-MMM-yyyy'): 'N/A'}</TableCell>
                                        <TableCell>{bill.billTo.name}</TableCell>
                                        <TableCell>
                                          <Badge className={cn(bill.paymentStatus === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'border-gray-500 text-white')}>
                                            {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(bill.calculatedAmounts.grandTotal)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => setBillToMarkPaid({ billId: bill.id, invoiceNumber: bill.invoiceDetails.invoiceNumber })} className="text-green-600 hover:text-green-700">
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : <p className="text-muted-foreground text-center py-4">No pending bills in this period{selectedCustomerId && selectedCustomerId !== 'all_customers' ? ' for the selected customer' : ''}.</p>}
                </CardContent>
            </Card>
             <div className="mt-6 p-4 bg-secondary/30 rounded-lg text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-2" data-ai-hint="calendar future"/>
                <p className="text-sm text-muted-foreground">Detailed payment analytics and aging reports are planned for future updates!</p>
            </div>
        </div>
      )}

      {billToViewPaymentDetails && (
        <ViewPaymentDetailsDialog
            bill={billToViewPaymentDetails}
            open={!!billToViewPaymentDetails}
            onOpenChange={(open) => { if (!open) setBillToViewPaymentDetails(null); }}
        />
      )}
      {billToMarkPaid && (
        <MarkAsPaidDialog
          billId={billToMarkPaid.billId}
          invoiceNumber={billToMarkPaid.invoiceNumber}
          open={!!billToMarkPaid}
          onOpenChange={(open) => {
            if (!open) setBillToMarkPaid(null);
          }}
          onConfirm={handleConfirmMarkAsPaid}
        />
      )}
    </div>
  );
}

