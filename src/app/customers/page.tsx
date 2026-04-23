'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Customer } from '@/types/customer';
import { CustomerSchema } from '@/types/customer';
import { loadCustomers, saveCustomers, addCustomer, updateCustomer } from '@/services/customer';
import { PlusCircle, Trash2, Ban, Pencil } from 'lucide-react';

const defaultCustomerValues: Omit<Customer, 'id'> = {
  name: '',
  address: '',
  gstin: '',
  state: '',
  stateCode: '',
  pan: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const formMethods = useForm<Omit<Customer, 'id'>>({
    resolver: zodResolver(CustomerSchema.omit({ id: true })),
    defaultValues: defaultCustomerValues,
  });

  const { handleSubmit, control, reset, formState: { errors, isSubmitting } } = formMethods;

  useEffect(() => {
    const loadedCustomers = loadCustomers();
    setCustomers(loadedCustomers);
    setIsLoading(false);
  }, []);

  const onSubmit = (data: Omit<Customer, 'id'>) => {
    try {
      if (editingCustomer) {
        const updated = updateCustomer(editingCustomer.id, data);
        setCustomers(prevCustomers => prevCustomers.map(c => c.id === updated.id ? updated : c));
        toast({
          title: 'Customer Updated',
          description: `Customer "${data.name}" has been updated successfully.`,
        });
      } else {
        const newCustomer = addCustomer(data);
        setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
        toast({
          title: 'Customer Added',
          description: `Customer "${data.name}" has been added successfully.`,
        });
      }
      handleCancelForm();
    } catch (error: any) {
      toast({
        title: editingCustomer ? 'Error Updating Customer' : 'Error Adding Customer',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (idToDelete: string) => {
    setCustomers(prevCustomers => {
      const updatedCustomers = prevCustomers.filter(customer => customer.id !== idToDelete);
      saveCustomers(updatedCustomers);
      return updatedCustomers;
    });
    toast({
      title: 'Customer Deleted',
      description: 'The customer has been removed.',
      variant: 'destructive',
    });
  }

  const handleAddNewCustomerClick = () => {
    setEditingCustomer(null);
    reset(defaultCustomerValues);
    setShowCustomerForm(true);
  };

  const handleEditCustomerClick = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      address: customer.address,
      gstin: customer.gstin || '',
      state: customer.state || '',
      stateCode: customer.stateCode || '',
      pan: customer.pan || '',
    });
    setShowCustomerForm(true);
  };

  const handleCancelForm = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
    reset(defaultCustomerValues);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold text-primary mb-4">Customers</h1>
        <div className="text-center py-10">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Customers</h1>
        {!showCustomerForm && (
          <Button onClick={handleAddNewCustomerClick} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        )}
      </div>

      {showCustomerForm && (
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </CardTitle>
          </CardHeader>
          <Form {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl><Input {...field} placeholder="Enter Customer Name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Enter Customer Address" rows={3} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="Enter GSTIN" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="pan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN No. (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="Enter PAN No." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="Enter State" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="stateCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State Code (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="Enter State Code" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancelForm}>
                  <Ban className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> 
                  {editingCustomer ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Adding...' : 'Add Customer')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>PAN</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="whitespace-pre-line text-xs">{customer.address}</TableCell>
                    <TableCell>{customer.gstin || '-'}</TableCell>
                    <TableCell>{customer.pan || '-'}</TableCell>
                    <TableCell>{customer.state ? `${customer.state} (${customer.stateCode || 'N/A'})` : '-'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditCustomerClick(customer)} className="text-primary hover:text-primary/80">
                        <Pencil className="h-4 w-4" />
                         <span className="sr-only">Edit Customer</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Customer</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !showCustomerForm && <p className="text-muted-foreground text-center py-4">No customers added yet. Click &quot;Add New Customer&quot; to begin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
