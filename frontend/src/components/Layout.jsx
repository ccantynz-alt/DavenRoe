import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const nav = [
  { path: '/', label: 'Dashboard', icon: '~' },
  { path: '/clients', label: 'Clients', icon: '@' },
  { path: '/review', label: 'Review Queue', icon: '>' },
  { path: '/reports', label: 'Reports', icon: '=' },
  { path: '/tax', label: 'Tax Engine', icon: '$' },
  { path: '/specialists', label: 'Specialist Tools', icon: '*' },
  { path: '/toolkit', label: 'Toolkit', icon: '#' },
  { path: '/ask', label: 'Ask Astra', icon: '?' },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold tracking-tight">Astra</h1>
          <p className="text-xs text-gray-400 mt-1">Autonomous Accounting</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.path
                  ? 'bg-astra-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="text-lg font-mono">{item.icon}</span>
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
            <span className="text-lg font-mono">!</span>
            Forensic / M&A
          </a>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          Phase 1 — The Brain
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
