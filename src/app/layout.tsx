
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import SidebarLayout from '@/components/layout/SidebarLayout';

export const metadata: Metadata = {
  title: 'Embroidery Billing Software',
  description: 'Billing software for embroidery businesses in Indian Rupees.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <SidebarProvider defaultOpen={true}>
          <SidebarLayout>
            {children}
          </SidebarLayout>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
