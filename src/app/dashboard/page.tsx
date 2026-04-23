
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        {/* Updated Link to point to /bills/new */}
        <Link href="/bills/new" passHref>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Bill
          </Button>
        </Link>
      </div>
      <p className="text-muted-foreground mb-8">Welcome to your Embroidery Billing dashboard.</p>

      {/* Placeholder content for dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-card border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Overview</h2>
          <p className="text-muted-foreground">Key metrics and summaries will appear here.</p>
           {/* Example placeholder data */}
           <div className="mt-4 space-y-2">
             <p className="text-sm">Total Bills: <span className="font-medium">0</span></p>
             <p className="text-sm">Pending Payments: <span className="font-medium">₹0.00</span></p>
           </div>
        </div>
        <div className="p-6 bg-card border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Recent Activity</h2>
          <p className="text-muted-foreground">A log of recent actions will be shown here.</p>
           {/* Example placeholder data */}
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>No recent activity yet.</li>
            </ul>
        </div>
        <div className="p-6 bg-card border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Quick Links</h2>
           <div className="mt-4 space-y-2">
             <Link href="/customers" className="block text-primary hover:underline">Manage Customers</Link>
             <Link href="/reports" className="block text-primary hover:underline">View Reports</Link>
             <Link href="/settings" className="block text-primary hover:underline">Application Settings</Link>
           </div>
        </div>
      </div>
    </div>
  );
}
