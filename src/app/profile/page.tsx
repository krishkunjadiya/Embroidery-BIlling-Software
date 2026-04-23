'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { ProfileData } from '@/types/profile';
import { ProfileDataSchema, defaultProfileData } from '@/types/profile';
import { loadProfileData, saveProfileData } from '@/services/profile';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Edit, Save, Ban } from 'lucide-react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const formMethods = useForm<ProfileData>({
    resolver: zodResolver(ProfileDataSchema),
    defaultValues: JSON.parse(JSON.stringify(defaultProfileData)), // Use a deep copy of defaults
  });

  const { handleSubmit, control, reset, formState: { errors, isDirty, isSubmitting } } = formMethods;

  useEffect(() => {
    const loadedData = loadProfileData();
    reset(loadedData); 
    setIsLoading(false);
  }, [reset]);

  const onSubmit = (data: ProfileData) => {
    saveProfileData(data);
    setIsEditing(false);
    reset(data); 
    toast({
      title: 'Profile Saved',
      description: 'Your details have been updated successfully.',
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    const loadedData = loadProfileData(); 
    reset(loadedData); 
    setIsEditing(false);
    toast({
      title: 'Edit Cancelled',
      description: 'Your changes were discarded.',
      variant: 'default',
    });
  };

  if (isLoading) {
    return (
       <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold text-primary mb-4">My Profile</h1>
         <div className="text-center py-10">Loading profile...</div>
       </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">My Profile</h1>
          {!isEditing && (
            <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mb-8">Manage your company and bank details here. These details will be used as defaults when creating new bills.</p>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Company Details</CardTitle>
          </CardHeader>
          <Form {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="companyDetails.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Company Name" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={control}
                  name="companyDetails.address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl><Textarea {...field} value={field.value || ''} placeholder="Enter Company Address" rows={3} readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={control}
                  name="companyDetails.gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter GSTIN (Optional)" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="companyDetails.pan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN No.</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter PAN No. (Optional)" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="companyDetails.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter State (Optional)" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="companyDetails.stateCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State Code</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter State Code (Optional)" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="companyDetails.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Phone (Optional)" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="companyDetails.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} value={field.value || ''} placeholder="Enter Email (Optional)" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <CardTitle className="text-xl text-primary pt-4">Bank Details (Optional)</CardTitle>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={control}
                  name="bankDetails.bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Bank Name" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={control}
                  name="bankDetails.accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Account Number" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={control}
                  name="bankDetails.ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter IFSC Code" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={control}
                  name="bankDetails.branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="Enter Branch Name" readOnly={!isEditing} className={!isEditing ? 'bg-muted/50 cursor-not-allowed' : ''}/></FormControl>
                    </FormItem>
                  )}
                />
               </div>

              {isEditing && (
                <CardFooter className="justify-end space-x-2 pt-6 px-0">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                     <Ban className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button type="submit" disabled={!isDirty || isSubmitting} className="bg-accent hover:bg-accent/90">
                    <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              )}
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </FormProvider>
  );
}
