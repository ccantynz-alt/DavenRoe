import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, LogOut, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalFooterDisclaimer } from '@/components/LegalDisclaimer';
import HelpWidget from '@/components/HelpWidget';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu';

const navSections = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard' },
      { path: '/practice', label: 'Practice Overview' },
      { path: '/financial-health', label: 'Health Score' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { path: '/clients', label: 'Clients' },
      { path: '/quotes', label: 'Quotes' },
      { path: '/invoicing', label: 'Invoicing' },
      { path: '/credit-notes', label: 'Credit Notes' },
    ],
  },
  {
    label: 'Purchases',
    items: [
      { path: '/suppliers', label: 'Suppliers' },
      { path: '/bills', label: 'Bills' },
      { path: '/purchase-orders', label: 'Purchase Orders' },
      { path: '/live-receipt', label: 'Live Receipt' },
      { path: '/spend-monitor', label: 'Spend Monitor' },
    ],
  },
  {
    label: 'Banking',
    items: [
      { path: '/banking', label: 'Bank Feeds' },
      { path: '/bank-reconciliation', label: 'Reconciliation' },
      { path: '/recurring', label: 'Recurring' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { path: '/chart-of-accounts', label: 'Chart of Accounts' },
      { path: '/journal-entries', label: 'Journal Entries' },
      { path: '/review', label: 'Review Queue' },
      { path: '/peer-review', label: 'Peer Review' },
      { path: '/fixed-assets', label: 'Fixed Assets' },
      { path: '/inventory', label: 'Inventory' },
      { path: '/budgets', label: 'Budgets' },
    ],
  },
  {
    label: 'Payroll & HR',
    items: [
      { path: '/payroll', label: 'Payroll' },
      { path: '/time-tracker', label: 'Time Tracker' },
    ],
  },
  {
    label: 'Tax & Compliance',
    items: [
      { path: '/tax', label: 'Tax Engine' },
      { path: '/tax-filing', label: 'Tax Filing' },
      { path: '/tax-rulings', label: 'Tax Rulings Agent' },
      { path: '/tax-advisor', label: 'Tax Advisor Toolkit' },
      { path: '/tax-agent', label: 'Tax Agent' },
      { path: '/compliance', label: 'Compliance Calendar' },
    ],
  },
  {
    label: 'Reports & Planning',
    items: [
      { path: '/reports', label: 'Reports' },
      { path: '/projects', label: 'Projects' },
      { path: '/scenarios', label: 'Scenario Planning' },
    ],
  },
  {
    label: 'AI & Intelligence',
    items: [
      { path: '/ask', label: 'Ask Astra' },
      { path: '/agentic', label: 'AI Agents' },
      { path: '/ai-insights', label: 'AI Insights' },
      { path: '/forensic-tools', label: 'Forensic Tools' },
      { path: '/smart-tools', label: 'Smart Tools' },
      { path: '/specialists', label: 'Specialist Tools' },
      { path: '/toolkit', label: 'Toolkit' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { path: '/documents', label: 'Documents' },
      { path: '/email-scanner', label: 'Email Scanner' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { path: '/marketplace', label: 'Marketplace' },
      { path: '/integrations', label: 'Integrations' },
      { path: '/partners', label: 'Partner Program' },
      { path: '/portal', label: 'Client Portal' },
      { path: '/case-studies', label: 'Case Studies' },
      { path: '/incorporate', label: 'Incorporate' },
      { path: '/enterprise', label: 'Enterprise' },
      { path: '/import', label: 'Data Import' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: '/admin', label: 'Command Center' },
      { path: '/activity', label: 'Activity Feed' },
      { path: '/billing', label: 'Billing' },
      { path: '/settings', label: 'Settings' },
      { path: '/help', label: 'Help Center' },
    ],
  },
];

const roleLabels = {
  partner: 'Partner',
  manager: 'Manager',
  senior: 'Senior',
  bookkeeper: 'Bookkeeper',
  client: 'Client',
};

const roleBadgeVariant = {
  partner: 'default',
  manager: 'secondary',
  senior: 'secondary',
  bookkeeper: 'outline',
  client: 'outline',
};

function NavSection({ section, pathname, onNavigate }) {
  const isActive = section.items.some(item => item.path === pathname);
  const [open, setOpen] = useState(isActive);

  return (
    <div className="mb-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold rounded h-auto',
          isActive
            ? 'text-indigo-400 hover:text-indigo-300 hover:bg-gray-800'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
        )}
      >
        {section.label}
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 space-y-0.5">
              {section.items.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={cn(
                    'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                    pathname === item.path
                      ? 'bg-indigo-700 text-white font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen flex">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          'w-56 bg-gray-900 text-white flex flex-col z-50 transition-transform duration-200',
          'fixed inset-y-0 left-0 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Astra</h1>
              <p className="text-[10px] text-gray-500">Autonomous Accounting</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            {navSections.map(section => (
              <NavSection
                key={section.label}
                section={section}
                pathname={pathname}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          {/* User Info */}
          {user && (
            <div className="p-3 border-t border-gray-800">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between px-2 py-2 h-auto text-left hover:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs font-medium truncate text-white">{user.full_name}</p>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {user.full_name}
                        </TooltipContent>
                      </Tooltip>
                      <Badge
                        variant={roleBadgeVariant[user.role] || 'outline'}
                        className="mt-0.5 text-[9px] px-1.5 py-0 h-4"
                      >
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>
                    <ChevronDown className="h-3 w-3 text-gray-500 shrink-0 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 h-9 w-9"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <h1 className="font-bold text-lg">Astra</h1>
            <div className="w-9" />
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-gray-50">
            {children}
            <GlobalFooterDisclaimer />
          </main>
          <HelpWidget />
        </div>
      </div>
    </TooltipProvider>
  );
}
