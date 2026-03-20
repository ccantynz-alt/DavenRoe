import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  { path: '/', label: 'Dashboard', icon: '~' },
  { path: '/clients', label: 'Clients', icon: '@' },
  { path: '/review', label: 'Review Queue', icon: '>' },
  { path: '/banking', label: 'Bank Feeds', icon: '$' },
  { path: '/invoicing', label: 'Invoicing', icon: '#' },
  { path: '/documents', label: 'Documents', icon: '^' },
  { path: '/reports', label: 'Reports', icon: '=' },
  { path: '/tax', label: 'Tax Engine', icon: '%' },
  { path: '/specialists', label: 'Specialist Tools', icon: '*' },
  { path: '/toolkit', label: 'Toolkit', icon: '+' },
  { path: '/ask', label: 'Ask Astra', icon: '?' },
  { path: '/agentic', label: 'Agentic AI', icon: '&' },
];

const roleLabels = {
  partner: 'Partner',
  manager: 'Manager',
  senior: 'Senior',
  bookkeeper: 'Bookkeeper',
  client: 'Client',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold tracking-tight">Astra</h1>
          <p className="text-xs text-gray-400 mt-1">Autonomous Accounting</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.path
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="text-lg font-mono w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Forensic Add-on */}
        <div className="px-4 pb-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2 px-3">Add-ons</p>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-pink-400 hover:bg-gray-800 transition-colors"
          >
            <span className="text-lg font-mono w-5 text-center">!</span>
            Forensic / M&A
          </a>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400">{roleLabels[user.role] || user.role}</p>
              </div>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
