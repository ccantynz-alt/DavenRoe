import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const nav = [
  { path: '/', label: 'Dashboard', icon: '#' },
  { path: '/due-diligence', label: '90-Min Audit', icon: '!' },
  { path: '/benfords', label: "Benford's Law", icon: '%' },
  { path: '/vendors', label: 'Vendor Audit', icon: '&' },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Dark sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Astra <span className="text-forensic-500">Forensic</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">M&A Due Diligence Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.path
                  ? 'bg-forensic-900/50 text-forensic-400 border border-forensic-800'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <span className="text-lg font-mono">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Back to Astra Main
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
