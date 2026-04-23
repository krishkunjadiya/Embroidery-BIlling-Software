
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Search, Trash2, Eye, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import type { Customer } from '@/types/customer';
import { loadCustomers } from '@/services/customer';
import type { SavedBill, PaymentDetails } from '@/types/bill';
import { loadBills, filterBills, deleteBill as deleteBillFromService, updateBillPaymentStatus } from '@/services/billService';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import MarkAsPaidDialog from '@/components/billing/MarkAsPaidDialog'; // Import the new dialog

type BillFilterType = 'all' | 'today' | 'month' | 'year' | 'custom';

export default function BillsListPage() {
  const [allBills, setAllBills] = useState<SavedBill[]>([]);
  const [displayedBills, setDisplayedBills] = useState<SavedBill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<BillFilterType>('all');
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  
  // State for MarkAsPaidDialog
  const [billToMarkPaid, setBillToMarkPaid] = useState<{ billId: string, invoiceNumber: string } | null>(null);
  // State for marking as pending (uses existing AlertDialog)
  const [billToMarkPending, setBillToMarkPending] = useState<{ billId: string, invoiceNumber: string } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const loadedCustomers = loadCustomers();
    setCustomers(loadedCustomers);
    const loadedSavedBills = loadBills();
    setAllBills(loadedSavedBills);
    setDisplayedBills(loadedSavedBills);
  }, []);

  const handleFilter = (filterType: BillFilterType) => {
    setActiveFilter(filterType);
    const newDisplayedBills = filterBills(allBills, {
      filterType,
      customerId: filterType === 'custom' ? selectedCustomerId : undefined,
      startDate: filterType === 'custom' ? fromDate : undefined,
      endDate: filterType === 'custom' ? toDate : undefined,
    });
    setDisplayedBills(newDisplayedBills);
  };

  const handleCustomFilterApply = () => {
    handleFilter('custom');
  };

  const clearCustomFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setSelectedCustomerId(undefined);
    handleFilter('all');
  };

  const handleDeleteBill = () => {
    if (billToDelete) {
      deleteBillFromService(billToDelete);
      const updatedBills = allBills.filter(bill => bill.id !== billToDelete);
      setAllBills(updatedBills);
      handleFilter(activeFilter); 
      toast({
        title: 'Bill Deleted',
        description: `Bill has been successfully deleted.`,
      });
      setBillToDelete(null);
    }
  };

  const handleConfirmMarkAsPaid = (billId: string, paymentDetails: PaymentDetails) => {
    const updatedBill = updateBillPaymentStatus(billId, 'paid', paymentDetails);
    if (updatedBill) {
      const updatedAllBills = allBills.map(b => b.id === updatedBill.id ? updatedBill : b);
      setAllBills(updatedAllBills);
      handleFilter(activeFilter);
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
    setBillToMarkPaid(null); // Close the dialog
  };

  const handleConfirmMarkAsPending = () => {
    if (billToMarkPending) {
      const updatedBill = updateBillPaymentStatus(billToMarkPending.billId, 'pending');
      if (updatedBill) {
        const updatedAllBills = allBills.map(b => b.id === updatedBill.id ? updatedBill : b);
        setAllBills(updatedAllBills);
        handleFilter(activeFilter);
        toast({
          title: 'Payment Status Updated',
          description: `Bill ${billToMarkPending.invoiceNumber} marked as pending.`,
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


  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Bill History</h1>
      </div>
      <p className="text-muted-foreground mb-8">View and manage your existing bills here. Use the filters below to narrow down your search.</p>

      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Filter Bills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => handleFilter('all')}>All Bills</Button>
            <Button variant={activeFilter === 'today' ? 'default' : 'outline'} onClick={() => handleFilter('today')}>Today&apos;s Bills</Button>
            <Button variant={activeFilter === 'month' ? 'default' : 'outline'} onClick={() => handleFilter('month')}>This Month</Button>
            <Button variant={activeFilter === 'year' ? 'default' : 'outline'} onClick={() => handleFilter('year')}>This Year</Button>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-md font-semibold text-muted-foreground">Custom Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <Label htmlFor="fromDate">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="fromDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="toDate">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="toDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      disabled={(date) =>
                        fromDate ? date < fromDate : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="customerName">Customer Name</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customerName" className="w-full">
                    <SelectValue placeholder="Select Customer" />
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
            </div>
            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={clearCustomFilters}>Clear Filters</Button>
                <Button onClick={handleCustomFilterApply} className="bg-primary hover:bg-primary/90">
                    <Search className="mr-2 h-4 w-4" /> Apply Custom Filters
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Filtered Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {displayedBills.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inv. No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.invoiceDetails.invoiceNumber}</TableCell>
                    <TableCell>{bill.invoiceDetails.date ? format(new Date(bill.invoiceDetails.date), 'dd-MMM-yyyy') : 'N/A'}</TableCell>
                    <TableCell>{bill.billTo.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.calculatedAmounts.grandTotal)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          bill.paymentStatus === 'paid' ? 'default' : 
                          bill.paymentStatus === 'pending' ? 'secondary' : 
                          'outline' 
                        }
                        className={cn(
                          bill.paymentStatus === 'paid' ? 'bg-green-500 hover:bg-green-600' :
                          bill.paymentStatus === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                          'border-gray-500', // For 'partial' or other statuses
                          'text-white' // Ensuring text is visible on colored badges
                        )}
                      >
                        {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/bills/${bill.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Bill</span>
                        </Link>
                      </Button>

                      {bill.paymentStatus !== 'paid' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setBillToMarkPaid({ billId: bill.id, invoiceNumber: bill.invoiceDetails.invoiceNumber })} 
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Mark as Paid</span>
                        </Button>
                      )}

                      {bill.paymentStatus !== 'pending' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setBillToMarkPending({ billId: bill.id, invoiceNumber: bill.invoiceDetails.invoiceNumber })} className="text-yellow-600 hover:text-yellow-700">
                              <Clock className="h-4 w-4" />
                              <span className="sr-only">Mark as Pending</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Payment Status Change</AlertDialogTitle>
                              <AlertDialogDescription>
                                Mark bill {bill.invoiceDetails.invoiceNumber} as pending?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setBillToMarkPending(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleConfirmMarkAsPending} className="bg-yellow-600 hover:bg-yellow-700">
                                Mark Pending
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setBillToDelete(bill.id)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Bill</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the bill
                              for invoice <span className="font-semibold">{bill.invoiceDetails.invoiceNumber}</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setBillToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteBill} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-10">
              No bills found matching your criteria. Create a new bill or adjust filters.
            </p>
          )}
        </CardContent>
      </Card>

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

