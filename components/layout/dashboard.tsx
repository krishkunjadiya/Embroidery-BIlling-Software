
import { useState, useEffect } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: {
    href: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }[];
}

export default function DashboardLayout({ children, menuItems }: DashboardLayoutProps) {
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const [isMobile, setIsMobile] = useState(false);
  const { openMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Sidebar
        className={cn(
          'bg-sidebar-background text-sidebar-foreground',
          isMobile && openMobile ? 'translate-x-0' : '-translate-x-full',
          'transition-transform duration-300 ease-in-out',
          'sm:translate-x-0 sm:shadow-none'
        )}
        collapsible="icon"
      >
        <SidebarHeader className="h-14 border-b bg-background px-4">
          <Link href="/bills" className="flex items-center space-x-2 font-semibold">
            {isMobile ? (
              <span>Embroidery Billing</span>
            ) : ( // This branch is for
              // SSR and the initial client render, which can cause hydration
              // mismatches if they don't match.
              //
              // The `isClient` check makes sure that the client and server render the same
              // thing during the initial render, and then updates it to the correct value
              // on the client after hydration.
              //
              // We also need to make sure that the `span` is present during the initial
              // client render, otherwise the server and client will have different HTML
              // structures, which will also cause a hydration mismatch.
              //
              // See https://nextjs.org/docs/messages/react-hydration-error for more information.
              //
              // The group-data-[collapsible=icon]:hidden class is used to hide the text when the sidebar is collapsed.
              // This class is applied by the parent div when the sidebar is collapsed.
              <span className="group-data-[collapsible=icon]:hidden">Embroidery Billing</span>
            )}
          </Link>
          {/* Sidebar trigger (collapse/expand button) is only shown on desktop */}
          {/* isMobile is false on server and initial client render, so this is fine */}
          {!isMobile && <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground" />}
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === item.href || (currentPath.startsWith(item.href + '/') && item.href !== '/')}
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
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
             <Link href="/bills" className="text-lg font-semibold text-primary sm:hidden">
                Embroidery Billing
             </Link>
             <Button
              size="icon"
              variant="outline"
              className="sm:hidden"
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

      