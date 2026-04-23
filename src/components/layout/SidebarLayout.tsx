'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserCircle,
  Users,
  FileText,
  BarChart3,
  DatabaseBackup,
  Settings,
  Menu as MenuIcon,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bills/new', label: 'Create New Bill', icon: PlusCircle },
  { href: '/profile', label: 'My Profile', icon: UserCircle },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/bills', label: 'Bills', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname() || '/';
  const { isMobile, setOpenMobile, state: sidebarState } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="border-r bg-sidebar text-sidebar-foreground hidden md:flex"
      >
        <SidebarHeader className="relative flex h-16 items-center justify-start p-4">
          <Link href="/bills" className="text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
             {isClient ? (
                <span className={cn(sidebarState === 'collapsed' && 'hidden')}>Embroidery Billing</span>
              ) : (
                <span>Embroidery Billing</span>
              )}
          </Link>
           {isClient && !isMobile && (
            <SidebarTrigger className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground hover:text-sidebar-accent-foreground" />
          )}
        </SidebarHeader>
        <SidebarContent className="flex flex-col p-2 pt-0">
          <SidebarMenu className="flex-grow">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/')}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  className="justify-start"
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col bg-background">
        {isClient && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 md:hidden">
             <Link href="/bills" className="text-lg font-semibold text-primary">
                Embroidery Billing
             </Link>
             <Button
              size="icon"
              variant="outline"
              onClick={() => setOpenMobile(true)}
            >
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </header>
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}