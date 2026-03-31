import { useState, useEffect, useRef } from 'react';

/**
 * Premium floating dashboard mockup with glass morphism frame,
 * animated floating notification cards, and smooth perspective tilt.
 */

export default function DashboardPreview() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-28 px-6 lg:px-16 bg-gradient-to-b from-white via-gray-50/50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-medium tracking-[0.2em] text-indigo-600 uppercase mb-3">The Platform</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Everything, at a glance</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">A command centre for your entire practice. Real-time data, AI insights, and full client oversight — all in one view.</p>
        </div>

        <div
          ref={ref}
          className="relative mx-auto max-w-5xl"
          style={{
            perspective: '1400px',
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease-out',
          }}
        >
          {/* Glow behind dashboard */}
          <div
            className="absolute inset-0 -inset-x-10 -bottom-10 rounded-3xl blur-3xl opacity-0 transition-opacity duration-1000"
            style={{
              background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.1) 0%, transparent 70%)',
              opacity: visible ? 1 : 0,
            }}
          />

          {/* Main dashboard frame */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-200/80 overflow-hidden"
            style={{
              transform: visible ? 'rotateX(2deg) scale(1)' : 'rotateX(8deg) scale(0.95)',
              transition: 'transform 1.2s ease-out',
              transformOrigin: 'center bottom',
            }}
          >
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-gray-200" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-lg px-6 py-1.5 text-xs text-gray-400 border border-gray-100 min-w-[300px] text-center flex items-center justify-center gap-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4"/></svg>
                  app.alecrae.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="flex">
              {/* Sidebar */}
              <div className="w-52 bg-[#0f1117] text-white p-4 hidden md:block" style={{ minHeight: 440 }}>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">A</div>
                  <span className="font-semibold text-sm">AlecRae</span>
                </div>
                <nav className="space-y-0.5 text-[13px]">
                  {[
                    { name: 'Dashboard', active: true },
                    { name: 'Clients' },
                    { name: 'Review Queue', badge: '7' },
                    { name: 'Bank Feeds' },
                    { name: 'Tax Engine' },
                    { name: 'Reports' },
                    { name: 'Invoicing' },
                    { name: 'Forensics' },
                    { name: 'Compliance' },
                    { name: 'Ask AlecRae' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${item.active ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                    >
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">{item.badge}</span>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main area */}
              <div className="flex-1 p-6 bg-gray-50" style={{ minHeight: 440 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-lg font-bold text-gray-900">Good morning, Sarah</div>
                    <div className="text-xs text-gray-500">Coastal Coffee Co — March 2026</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 font-medium">All systems live</span>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Revenue MTD', value: '$245,100', change: '+12.4%', up: true },
                    { label: 'Pending Review', value: '7', change: '-84%', up: true },
                    { label: 'Cash Position', value: '$1.2M', change: '+3.1%', up: true },
                    { label: 'Risk Alerts', value: '2', change: 'Low', up: null },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="text-[10px] text-gray-500 mb-1">{card.label}</div>
                      <div className="text-lg font-bold text-gray-900">{card.value}</div>
                      <div className={`text-[10px] font-medium ${card.up === true ? 'text-emerald-600' : card.up === false ? 'text-red-600' : 'text-gray-400'}`}>
                        {card.change}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + activity */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs font-semibold text-gray-900 mb-3">Revenue vs Expenses</div>
                    <div className="flex items-end gap-1.5 h-28">
                      {[65, 72, 58, 80, 74, 85, 90, 78, 92, 88, 95, 82].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-0.5">
                          <div className="bg-indigo-500 rounded-t" style={{ height: `${h}%` }} />
                          <div className="bg-indigo-100 rounded-b" style={{ height: `${h * 0.6}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[8px] text-gray-400">
                      <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs font-semibold text-gray-900 mb-3">Recent Activity</div>
                    <div className="space-y-2.5">
                      {[
                        { text: 'BAS Q3 lodged', time: '2m ago', color: 'bg-emerald-500' },
                        { text: '124 txns categorised', time: '5m ago', color: 'bg-indigo-500' },
                        { text: 'Invoice #1047 paid', time: '12m ago', color: 'bg-blue-500' },
                        { text: 'Anomaly detected', time: '1h ago', color: 'bg-amber-500' },
                        { text: 'Bank feed synced', time: '2h ago', color: 'bg-emerald-500' },
                        { text: 'Monthly close done', time: '3h ago', color: 'bg-violet-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${item.color} flex-shrink-0`} />
                          <span className="text-[10px] text-gray-700 flex-1 truncate">{item.text}</span>
                          <span className="text-[8px] text-gray-400 flex-shrink-0">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating notification cards */}
          <FloatingCard className="-left-12 top-20 hidden lg:block" delay={0.3} visible={visible}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">Month-end closed</div>
                <div className="text-[10px] text-gray-500">Completed in 4.2 seconds</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-right-10 top-36 hidden lg:block" delay={0.6} visible={visible}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">AI Accuracy: 94.7%</div>
                <div className="text-[10px] text-gray-500">1,198 of 1,247 auto-matched</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-right-6 bottom-16 hidden lg:block" delay={0.9} visible={visible}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">Forensic alert</div>
                <div className="text-[10px] text-gray-500">Vendor structuring detected</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-left-10 bottom-28 hidden lg:block" delay={1.2} visible={visible}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600">$</div>
              <div>
                <div className="text-xs font-semibold text-gray-900">Treaty benefit applied</div>
                <div className="text-[10px] text-gray-500">AU-US DTA saved $45,000</div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({ children, className, delay, visible }) {
  return (
    <div
      className={`absolute z-20 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 p-3.5 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.8s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
