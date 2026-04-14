import { useState, useEffect, useRef } from 'react';

/**
 * Premium floating dashboard mockup with cinematic perspective tilt,
 * animated glow ring, and floating notification cards.
 */

export default function DashboardPreview() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleMouse = (e) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -4, y: x * 4 });
  };

  const handleLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <section className="py-32 px-6 lg:px-16 bg-gradient-to-b from-white via-gray-50/30 to-white overflow-hidden relative">
      {/* Subtle radial gradient behind */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.04) 0%, transparent 60%)',
      }} />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-20">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.6s ease-out',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-indigo-600 tracking-wide uppercase">Live Platform Preview</span>
          </div>
          <h2
            className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s ease-out 0.1s',
            }}
          >
            Everything, at a glance
          </h2>
          <p
            className="text-lg text-gray-500 max-w-2xl mx-auto"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s ease-out 0.2s',
            }}
          >
            A command centre for your entire practice. Real-time data, AI insights, and full client oversight.
          </p>
        </div>

        <div
          ref={ref}
          className="relative mx-auto max-w-5xl"
          onMouseMove={handleMouse}
          onMouseLeave={handleLeave}
          style={{ perspective: '1800px' }}
        >
          {/* Animated glow ring */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-0 transition-opacity duration-1000"
            style={{
              opacity: visible ? 1 : 0,
              background: 'conic-gradient(from 0deg, transparent, rgba(99,102,241,0.15), transparent, rgba(139,92,246,0.15), transparent)',
              animation: visible ? 'glow-spin 8s linear infinite' : 'none',
              filter: 'blur(30px)',
            }}
          />

          {/* Shadow */}
          <div
            className="absolute inset-x-8 -bottom-8 h-32 rounded-3xl blur-3xl transition-opacity duration-1000"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)',
              opacity: visible ? 1 : 0,
            }}
          />

          {/* Main dashboard frame */}
          <div
            ref={frameRef}
            className="relative bg-white rounded-2xl shadow-2xl shadow-gray-300/40 border border-gray-200/80 overflow-hidden"
            style={{
              transform: visible
                ? `rotateX(${2 + tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`
                : 'rotateX(12deg) scale(0.9)',
              transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: 'center bottom',
            }}
          >
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-lg px-6 py-1.5 text-xs text-gray-400 border border-gray-100 min-w-[300px] text-center flex items-center justify-center gap-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4"/></svg>
                  app.davenroe.com/dashboard
                </div>
              </div>
              <div className="w-[52px]" />
            </div>

            {/* Dashboard content */}
            <div className="flex">
              {/* Sidebar */}
              <div className="w-52 bg-[#0a0b10] text-white p-4 hidden md:block" style={{ minHeight: 460 }}>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">A</div>
                  <div>
                    <span className="font-semibold text-sm">DavenRoe</span>
                    <span className="block text-[9px] text-white/30 tracking-widest uppercase">Accounting</span>
                  </div>
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
                    { name: 'AI Agents', dot: true },
                    { name: 'Ask DavenRoe' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${item.active ? 'bg-indigo-600/20 text-white border border-indigo-500/20' : 'text-gray-500 hover:text-gray-400'}`}
                    >
                      <span className="flex items-center gap-2">
                        {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">{item.badge}</span>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main area */}
              <div className="flex-1 p-6 bg-gray-50" style={{ minHeight: 460 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-lg font-bold text-gray-900">Good morning, Sarah</div>
                    <div className="text-xs text-gray-500">Coastal Coffee Co — March 2026</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] text-emerald-700 font-medium">All systems live</span>
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Revenue MTD', value: '$245,100', change: '+12.4%', up: true },
                    { label: 'Pending Review', value: '7', change: '-84% vs last', up: true },
                    { label: 'Cash Position', value: '$1.2M', change: '+3.1%', up: true },
                    { label: 'AI Confidence', value: '94.7%', change: '1,198 auto', up: null },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                      <div className="text-[10px] text-gray-500 mb-1 font-medium">{card.label}</div>
                      <div className="text-xl font-bold text-gray-900 tracking-tight">{card.value}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${card.up === true ? 'text-emerald-600' : card.up === false ? 'text-red-600' : 'text-indigo-500'}`}>
                        {card.change}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + activity */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold text-gray-900">Revenue vs Expenses</div>
                      <div className="flex gap-3 text-[9px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500" /> Revenue</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-200" /> Expenses</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5 h-28">
                      {[65, 72, 58, 80, 74, 85, 90, 78, 92, 88, 95, 82].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-0.5">
                          <div className="bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t" style={{ height: `${h}%` }} />
                          <div className="bg-indigo-100 rounded-b" style={{ height: `${h * 0.55}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[8px] text-gray-400">
                      <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-xs font-semibold text-gray-900 mb-3">Live Activity</div>
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
          <FloatingCard className="-left-16 top-16 hidden lg:block" delay={0.3} visible={visible}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Month-end closed</div>
                <div className="text-[10px] text-gray-500">Completed in <span className="text-emerald-600 font-semibold">4.2 seconds</span></div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-right-14 top-32 hidden lg:block" delay={0.6} visible={visible}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">AI Accuracy: 94.7%</div>
                <div className="text-[10px] text-gray-500">1,198 of 1,247 auto-matched</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-right-8 bottom-12 hidden lg:block" delay={0.9} visible={visible}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Forensic alert</div>
                <div className="text-[10px] text-gray-500">Vendor structuring <span className="text-amber-600 font-semibold">detected</span></div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-left-12 bottom-24 hidden lg:block" delay={1.2} visible={visible}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-sm">
                <span className="text-base font-bold text-blue-600">$</span>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Treaty benefit applied</div>
                <div className="text-[10px] text-gray-500">AU-US DTA saved <span className="text-blue-600 font-semibold">$45,000</span></div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>

      <style>{`
        @keyframes glow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

function FloatingCard({ children, className, delay, visible }) {
  return (
    <div
      className={`absolute z-20 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl shadow-gray-200/40 border border-gray-100 p-3.5 hover:scale-105 transition-transform duration-300 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
