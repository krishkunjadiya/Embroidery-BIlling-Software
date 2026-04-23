'use client';

import React, { useState, useEffect } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle, Trash2, ChevronsUpDown, Check, Save } from 'lucide-react';
import type { BillFormData } from '@/types/billing';
import { cn, formatCurrency } from '@/lib/utils';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import type { Customer } from '@/types/customer';
import { loadCustomers, getCustomerByName, addCustomer } from '@/services/customer';
import { useToast } from '@/hooks/use-toast';


interface BillFormProps {
  control: Control<BillFormData>;
  errors: FieldErrors<BillFormData>;
}

const BillForm: React.FC<BillFormProps> = ({ control, errors }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const { getValues, watch, setValue } = useFormContext<BillFormData>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerComboboxOpen, setCustomerComboboxOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loaded = loadCustomers();
    setCustomers(loaded);
  }, []);

  const items = watch('items');
  const discountPercentage = watch('discountPercentage');
  const applyDiscountToTaxableAmount = watch('applyDiscountToTaxableAmount');
  const billToName = watch('billTo.name');

  useEffect(() => {
    if (billToName && billToName.trim()) {
      const existingCustomer = getCustomerByName(billToName);
      setIsNewCustomer(!existingCustomer);
    } else {
      setIsNewCustomer(false);
    }
  }, [billToName]);

  const itemsForSubtotal = watch('items'); // Use a separate watch for subTotal dependency if needed, or stringify
  const itemsStringForSubtotal = JSON.stringify(itemsForSubtotal);

  const subTotal = React.useMemo(() => {
    return (itemsForSubtotal || []).reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + (quantity * rate);
    }, 0);
  }, [itemsStringForSubtotal]); // Depend on the stringified version of items

  const calculatedDiscountAmountDisplay = React.useMemo(() => {
    const currentDiscountPercentage = Number(discountPercentage) || 0;
    if (currentDiscountPercentage > 0 && subTotal > 0) {
      const discount = (subTotal * currentDiscountPercentage) / 100;
      return parseFloat(discount.toFixed(2));
    }
    return 0;
  }, [subTotal, discountPercentage]);

  const addNewItem = () => {
    append({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      description: '',
      hsnCode: '',
      quantity: null,
      unit: 'Mtr.',
      rate: null,
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleNumericChange = (fieldOnChange: (value: number | null) => void, event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    if (rawValue === '') {
      fieldOnChange(null);
    } else {
      const numValue = parseFloat(rawValue);
      fieldOnChange(Number.isNaN(numValue) ? null : numValue);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    if (document.activeElement === event.currentTarget) {
      event.currentTarget.blur();
    }
  };

  const handleCustomerSelect = (customerName: string) => {
    const selectedCustomer = getCustomerByName(customerName);
    setValue('billTo.name', customerName);

    if (selectedCustomer) {
      setValue('billTo.address', selectedCustomer.address);
      setValue('billTo.gstin', selectedCustomer.gstin || '');
      setValue('billTo.state', selectedCustomer.state || '');
      setValue('billTo.stateCode', selectedCustomer.stateCode || '');
      setValue('billTo.pan', selectedCustomer.pan || '');
      setIsNewCustomer(false);
    } else {
      if (customerName && customerName.trim()) {
        setIsNewCustomer(true);
         // Optionally clear other fields if it's a new customer typed in
        setValue('billTo.address', '');
        setValue('billTo.gstin', '');
        setValue('billTo.state', '');
        setValue('billTo.stateCode', '');
        setValue('billTo.pan', '');
      } else {
        setIsNewCustomer(false);
      }
    }
  };

  const handleSaveNewCustomer = () => {
    const customerDataToSave = {
      ...getValues('billTo'),
      gstin: getValues('billTo.gstin') || '',
      pan: getValues('billTo.pan') || '',
      state: getValues('billTo.state') || '',
      stateCode: getValues('billTo.stateCode') || '',
    };

    if (!customerDataToSave.name || !customerDataToSave.address) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least a name and address for the new customer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newCustomer = addCustomer(customerDataToSave);
      setCustomers(prev => [...prev, newCustomer]);
      setIsNewCustomer(false);
      toast({
        title: 'Customer Saved',
        description: `Customer "${newCustomer.name}" added successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error Saving Customer',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Company Details - Read Only */}
      <section className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
        <h3 className="text-lg font-semibold text-primary">Your Company Details (From Profile)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="companyDetails.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="companyDetails.address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" rows={2} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="companyDetails.gstin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSTIN</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="companyDetails.pan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAN No.</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="companyDetails.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="companyDetails.stateCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State Code</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="companyDetails.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="companyDetails.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* Bill To Details */}
      <section className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
        <h3 className="text-lg font-semibold text-primary">Bill To</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="billTo.name"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Customer Name</FormLabel>
                <Popover open={customerComboboxOpen} onOpenChange={setCustomerComboboxOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerComboboxOpen}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? field.value : "Select or type customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command shouldFilter={false}> {/* Set shouldFilter to false to allow custom input */}
                      <CommandInput
                        placeholder="Search or type customer..."
                        value={field.value || ''}
                        onValueChange={(search) => {
                          field.onChange(search); // Update RHF state immediately
                          handleCustomerSelect(search); // Handle selection/new customer logic
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>No customer found. Type to add new.</CommandEmpty>
                        <CommandGroup>
                          {customers.filter(c => c.name.toLowerCase().includes((field.value || '').toLowerCase())).map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name} // This value is used by Command for filtering if shouldFilter is true
                              onSelect={(currentValue) => { // currentValue is the string displayed in CommandItem
                                const selectedName = customers.find(c => c.name.toLowerCase() === currentValue.toLowerCase())?.name || currentValue;
                                field.onChange(selectedName); // Update RHF with the selected/typed name
                                handleCustomerSelect(selectedName); // Populate other fields
                                setCustomerComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value?.toLowerCase() === customer.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="billTo.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Address</FormLabel>
                <FormControl><Textarea {...field} placeholder="Enter Customer Address" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="billTo.gstin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer GSTIN</FormLabel>
                <FormControl><Input {...field} placeholder="Enter Customer GSTIN (Optional)" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="billTo.pan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer PAN No.</FormLabel>
                <FormControl><Input {...field} placeholder="Enter Customer PAN (Optional)" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="billTo.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl><Input {...field} placeholder="Enter State (Optional)" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="billTo.stateCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State Code</FormLabel>
                <FormControl><Input {...field} placeholder="Enter State Code (Optional)" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {isNewCustomer && (
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" onClick={handleSaveNewCustomer} variant="secondary">
              <Save className="mr-2 h-4 w-4" /> Save Customer Details
            </Button>
          </div>
        )}
      </section>

      {/* Invoice Details */}
      <section className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
        <h3 className="text-lg font-semibold text-primary">Invoice Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="invoiceDetails.invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Invoice Number" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="invoiceDetails.date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Invoice Date</FormLabel>
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
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* Bill Items */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-primary">Items</h3>
          <Button type="button" size="sm" onClick={addNewItem} variant="outline" >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
        {fields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 border rounded-md items-start bg-secondary/20">
            <FormField
              control={control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel className="text-xs">Particular</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Enter Particular" rows={2} className="text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.hsnCode`}
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs">HSN Code</FormLabel>
                  <FormControl><Input {...field} placeholder="Enter HSN Code" className="text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.quantity`}
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs">Meter (Mtr.)</FormLabel>
                  <FormControl><Input type="number" {...field} placeholder="Enter Meter" className="text-sm" step="any"
                    value={field.value === null || Number.isNaN(field.value as number) ? '' : String(field.value)}
                    onWheel={handleWheel}
                    onChange={(e) => handleNumericChange(field.onChange, e)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.unit`}
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel className="text-xs">Unit</FormLabel>
                  <FormControl><Input {...field} placeholder="Unit" className="text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.rate`}
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs">Rate (₹)</FormLabel>
                  <FormControl><Input type="number" {...field} placeholder="Enter Rate (₹)" className="text-sm" step="any"
                    value={field.value === null || Number.isNaN(field.value as number) ? '' : String(field.value)}
                    onWheel={handleWheel}
                    onChange={(e) => handleNumericChange(field.onChange, e)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-1 flex items-end h-full">
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/80 mt-auto"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove Item</span>
                </Button>
              )}
            </div>
            <FormItem className="md:col-span-1 md:flex md:items-end h-full">
              <p className="text-sm font-medium pt-1 md:pt-0">
                {formatCurrency((Number(getValues(`items.${index}.quantity`)) || 0) * (Number(getValues(`items.${index}.rate`)) || 0))}
              </p>
            </FormItem>
          </div>
        ))}
        {errors.items && <p className="text-sm font-medium text-destructive">{errors.items.message || (errors.items.root && errors.items.root.message)}</p>}
      </section>

      <section className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
        <h3 className="text-lg font-semibold text-primary">Discount</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <FormField
            control={control}
            name="discountPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (%)</FormLabel>
                <FormControl><Input type="number" {...field} placeholder="Enter Discount (%)" step="any"
                  value={field.value === null || Number.isNaN(field.value as number) ? '' : String(field.value)}
                  onWheel={handleWheel}
                  onChange={(e) => handleNumericChange(field.onChange, e)} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Calculated Discount Amount (₹)</FormLabel>
            <FormControl>
              <Input
                readOnly
                value={formatCurrency(calculatedDiscountAmountDisplay)}
                className="bg-muted/50"
              />
            </FormControl>
          </FormItem>
          <FormField
            control={control}
            name="applyDiscountToTaxableAmount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 pt-5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="applyDiscountCheckbox"
                  />
                </FormControl>
                <FormLabel htmlFor="applyDiscountCheckbox" className="font-normal cursor-pointer">Apply to Taxable Amount</FormLabel>
              </FormItem>
            )}
          />
        </div>
        {!applyDiscountToTaxableAmount && (
          <p className="text-xs text-muted-foreground">Discount will be applied after GST.</p>
        )}
      </section>

      <section className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
        <h3 className="text-lg font-semibold text-primary">GST Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="gstSettings.cgstRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CGST Rate (%)</FormLabel>
                <FormControl><Input type="number" {...field} placeholder="Enter CGST Rate (%)"
                  value={field.value === null || Number.isNaN(field.value as number) ? '' : String(field.value)}
                  onWheel={handleWheel}
                  onChange={(e) => handleNumericChange(field.onChange, e)} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="gstSettings.sgstRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SGST Rate (%)</FormLabel>
                <FormControl><Input type="number" {...field} placeholder="Enter SGST Rate (%)"
                  value={field.value === null || Number.isNaN(field.value as number) ? '' : String(field.value)}
                  onWheel={handleWheel}
                  onChange={(e) => handleNumericChange(field.onChange, e)} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <section className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
        <h3 className="text-lg font-semibold text-primary">Bank Details (Optional - From Profile)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="bankDetails.bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Bank Name</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="bankDetails.accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Account Number</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="bankDetails.ifscCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">IFSC Code</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="bankDetails.branchName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Branch Name</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
              </FormItem>
            )}
          />
        </div>
      </section>

      <section className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
        <h3 className="text-lg font-semibold text-primary">Terms &amp; Conditions (Optional)</h3>
        <FormField
          control={control}
          name="termsAndConditions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Enter terms and conditions, each on a new line."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>
    </div>
  );
};

export default BillForm;
