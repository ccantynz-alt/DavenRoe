import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const EXAMPLE_COMMANDS = [
  {
    id: 1,
    command: 'Show me all overdue invoices',
    icon: '📋',
    category: 'Invoicing',
    result: {
      title: 'Overdue Invoices Found',
      subtitle: '3 invoices past due',
      items: [
        { label: 'INV-1847 — Acme Corp', value: '$12,400.00', detail: '14 days overdue', status: 'critical' },
        { label: 'INV-1823 — Meridian LLC', value: '$6,750.00', detail: '7 days overdue', status: 'warning' },
        { label: 'INV-1801 — BluePeak Industries', value: '$3,200.00', detail: '3 days overdue', status: 'warning' },
      ],
      summary: 'Total overdue: $22,350.00',
      action: 'Send reminders to all',
    },
  },
  {
    id: 2,
    command: 'Run month-end close for March',
    icon: '📅',
    category: 'Agentic AI',
    result: {
      title: 'Month-End Close Complete',
      subtitle: 'March 2026 closed in 4.2 seconds',
      items: [
        { label: 'Bank Reconciliation', value: 'Matched', detail: '247 transactions reconciled', status: 'success' },
        { label: 'Accruals & Prepayments', value: 'Processed', detail: '12 journal entries created', status: 'success' },
        { label: 'Revenue Recognition', value: 'Applied', detail: 'ASC 606 compliant', status: 'success' },
        { label: 'Trial Balance', value: 'Balanced', detail: 'Debits = Credits verified', status: 'success' },
      ],
      summary: 'All close tasks completed successfully',
      action: 'View close report',
    },
  },
  {
    id: 3,
    command: "What's my cash position right now?",
    icon: '💰',
    category: 'Banking',
    result: {
      title: 'Current Cash Position',
      subtitle: 'Across 4 connected accounts',
      items: [
        { label: 'ANZ Business Account', value: '$84,320.15', detail: 'Primary operating', status: 'success' },
        { label: 'Westpac Savings', value: '$142,500.00', detail: 'Reserve fund', status: 'success' },
        { label: 'Stripe Balance', value: '$12,847.60', detail: 'Pending settlement', status: 'info' },
        { label: 'PayPal Business', value: '$3,215.40', detail: 'Available to withdraw', status: 'info' },
      ],
      summary: 'Total cash available: $242,883.15',
      action: 'View cash flow forecast',
    },
  },
  {
    id: 4,
    command: 'Send payment reminder to Acme Corp',
    icon: '📧',
    category: 'Collections',
    result: {
      title: 'Payment Reminder Sent',
      subtitle: 'To Acme Corp — accounts@acmecorp.com',
      items: [
        { label: 'Invoice #INV-1847', value: '$12,400.00', detail: '14 days overdue', status: 'warning' },
        { label: 'Tone', value: 'Professional', detail: 'Escalation level 2 of 4', status: 'info' },
        { label: 'Delivery', value: 'Email sent', detail: 'Delivered at 2:34 PM AEST', status: 'success' },
      ],
      summary: 'Follow-up scheduled in 5 business days if unpaid',
      action: 'View reminder email',
    },
  },
  {
    id: 5,
    command: 'Create an invoice for NorthStar, $4,500 for consulting',
    icon: '🧾',
    category: 'Invoicing',
    result: {
      title: 'Invoice Created',
      subtitle: 'INV-1862 — Draft',
      items: [
        { label: 'Client', value: 'NorthStar Pty Ltd', detail: 'ABN 42 123 456 789', status: 'info' },
        { label: 'Line Item', value: '$4,500.00', detail: 'Consulting Services', status: 'info' },
        { label: 'GST (10%)', value: '$450.00', detail: 'Inclusive', status: 'info' },
        { label: 'Total', value: '$4,950.00', detail: 'Due in 14 days', status: 'success' },
      ],
      summary: 'Invoice ready to send',
      action: 'Review & send invoice',
    },
  },
  {
    id: 6,
    command: 'How much tax do I owe this quarter?',
    icon: '🏛️',
    category: 'Tax',
    result: {
      title: 'Q1 2026 Tax Summary',
      subtitle: 'Estimated obligations by jurisdiction',
      items: [
        { label: 'GST (Australia)', value: '$18,420.00', detail: 'BAS due 28 April 2026', status: 'warning' },
        { label: 'PAYG Withholding', value: '$32,150.00', detail: 'Next instalment 21 April', status: 'warning' },
        { label: 'GST (New Zealand)', value: 'NZ$4,200.00', detail: 'Filed — awaiting refund', status: 'success' },
        { label: 'VAT (United Kingdom)', value: '£2,860.00', detail: 'Due 7 May 2026', status: 'info' },
      ],
      summary: 'Total estimated: ~AU$61,230 equivalent across jurisdictions',
      action: 'View full tax calendar',
    },
  },
  {
    id: 7,
    command: 'Run a Benford analysis on last quarter',
    icon: '🔍',
    category: 'Forensic',
    result: {
      title: "Benford's Law Analysis",
      subtitle: 'Q4 2025 — 1,847 transactions analyzed',
      items: [
        { label: 'First Digit Test', value: 'Pass', detail: 'Chi-squared: 0.042 (threshold: 0.05)', status: 'success' },
        { label: 'Second Digit Test', value: 'Pass', detail: 'Chi-squared: 0.031', status: 'success' },
        { label: 'Anomalies Detected', value: '3', detail: 'Digit 8 over-represented by 2.1%', status: 'warning' },
        { label: 'Risk Level', value: 'Low', detail: 'Within normal statistical variance', status: 'success' },
      ],
      summary: 'No significant evidence of data manipulation detected',
      action: 'View detailed forensic report',
    },
  },
  {
    id: 8,
    command: 'Schedule a payroll run for Friday',
    icon: '💳',
    category: 'Payroll',
    result: {
      title: 'Payroll Run Scheduled',
      subtitle: 'Friday 4 April 2026',
      items: [
        { label: 'Employees', value: '24', detail: 'All active full-time & part-time', status: 'info' },
        { label: 'Gross Pay', value: '$87,420.00', detail: 'Based on current pay rates', status: 'info' },
        { label: 'PAYG Withholding', value: '$19,280.00', detail: 'Tax table 2025-26', status: 'info' },
        { label: 'Super Guarantee', value: '$10,053.30', detail: '11.5% SGC rate', status: 'info' },
      ],
      summary: 'Net payroll: $68,140.00 — Requires approval before processing',
      action: 'Review payroll details',
    },
  },
];

const STATUS_STYLES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

function PulsingMicrophone({ isListening, onClick }) {
  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <span className="absolute w-32 h-32 rounded-full bg-indigo-400 opacity-20 animate-ping" />
          <span
            className="absolute w-40 h-40 rounded-full bg-indigo-300 opacity-10"
            style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.3s' }}
          />
        </>
      )}
      <button
        onClick={onClick}
        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isListening
            ? 'bg-indigo-600 text-white scale-110 shadow-indigo-300'
            : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 hover:scale-105'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
    </div>
  );
}

function WaveformVisualizer({ active }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-[3px] h-12 my-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${active ? 'bg-indigo-500' : 'bg-gray-200'}`}
          style={{
            height: active ? `${12 + Math.sin((Date.now() / 200) + i * 0.5) * 16 + Math.random() * 8}px` : '6px',
            animation: active ? `waveform 0.6s ease-in-out ${i * 0.04}s infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0% { height: 8px; }
          100% { height: ${28 + Math.random() * 12}px; }
        }
      `}</style>
    </div>
  );
}

function ResultCard({ result }) {
  if (!result) return null;
  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
          <p className="text-sm text-gray-500">{result.subtitle}</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Completed
        </span>
      </div>
      <div className="space-y-3">
        {result.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[item.status]}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
      {result.summary && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{result.summary}</p>
          {result.action && (
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              {result.action} &rarr;
            </button>
          )}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function VoiceCommand() {
  const toast = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeResult, setActiveResult] = useState(null);
  const [commandHistory, setCommandHistory] = useState([
    { command: 'Show me last week\'s revenue', time: '10:14 AM', status: 'success' },
    { command: 'Reconcile ANZ business account', time: '9:52 AM', status: 'success' },
    { command: 'What invoices are due this week?', time: '9:31 AM', status: 'success' },
    { command: 'Create expense claim for travel', time: 'Yesterday 4:45 PM', status: 'success' },
    { command: 'Run compliance check for Q1', time: 'Yesterday 2:20 PM', status: 'success' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const typingRef = useRef(null);

  const simulateVoiceCommand = useCallback((cmd) => {
    if (isTyping) return;

    setActiveResult(null);
    setTranscript('');
    setIsListening(true);
    setWaveActive(true);
    setIsTyping(true);

    // Simulate typing the transcript character by character
    let charIndex = 0;
    const text = cmd.command;
    typingRef.current = setInterval(() => {
      charIndex++;
      setTranscript(text.slice(0, charIndex));
      if (charIndex >= text.length) {
        clearInterval(typingRef.current);
        // Brief pause then show result
        setTimeout(() => {
          setIsListening(false);
          setWaveActive(false);
          setActiveResult(cmd.result);
          setIsTyping(false);
          setCommandHistory((prev) => [
            { command: cmd.command, time: 'Just now', status: 'success' },
            ...prev.slice(0, 9),
          ]);
          toast.success(`Voice command executed: "${cmd.command}"`);
        }, 600);
      }
    }, 35);
  }, [isTyping, toast]);

  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      setWaveActive(false);
      setIsTyping(false);
      if (typingRef.current) clearInterval(typingRef.current);
      toast.info('Voice input cancelled');
    } else {
      setIsListening(true);
      setWaveActive(true);
      toast.info('Listening... click an example command or the microphone to stop');
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🎙️</span>
            Voice Commands
          </h1>
          <p className="text-gray-500 mt-1">Speak to your accounting software. The first voice-controlled accounting platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl border px-4 py-2 text-sm">
            <span className="text-gray-500">Commands today:</span>
            <span className="ml-2 font-semibold text-indigo-600">432</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-sm">
            <span className="text-emerald-700 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-lg">Voice commands work anywhere in Astra</p>
            <p className="text-indigo-200 text-sm">Click the microphone or press Ctrl+Shift+V from any page to start a voice command</p>
          </div>
        </div>
        <span className="bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium">Industry First</span>
      </div>

      {/* Microphone + Transcript Section */}
      <div className="bg-white rounded-xl border p-8">
        <div className="flex flex-col items-center">
          <PulsingMicrophone isListening={isListening} onClick={handleMicClick} />

          <p className="mt-4 text-sm text-gray-500">
            {isListening ? 'Listening... speak your command' : 'Click the microphone or select an example below'}
          </p>

          <WaveformVisualizer active={waveActive} />

          {/* Transcript */}
          {transcript && (
            <div className="w-full max-w-2xl mt-2">
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Transcript</p>
                <p className="text-lg text-gray-900 font-medium">
                  &ldquo;{transcript}&rdquo;
                  {isTyping && <span className="inline-block w-0.5 h-5 bg-indigo-600 ml-0.5 animate-pulse align-text-bottom" />}
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {activeResult && (
            <div className="w-full max-w-2xl mt-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">AI Response</p>
              <ResultCard result={activeResult} />
            </div>
          )}
        </div>
      </div>

      {/* Example Commands */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Try a voice command</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXAMPLE_COMMANDS.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => simulateVoiceCommand(cmd)}
              disabled={isTyping}
              className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:border-indigo-200 group ${
                isTyping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{cmd.icon}</span>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{cmd.category}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                &ldquo;{cmd.command}&rdquo;
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Commands + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Commands */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Commands</h2>
          <div className="space-y-3">
            {commandHistory.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">&ldquo;{item.command}&rdquo;</p>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Voice Command Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Commands Today</span>
                  <span className="text-sm font-semibold text-gray-900">432</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-sm font-semibold text-emerald-600">98.4%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '98.4%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="text-sm font-semibold text-gray-900">1.2s</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm font-semibold text-gray-900">89</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Popular Categories</h3>
            <div className="space-y-2">
              {[
                { name: 'Invoicing', pct: 34, color: 'bg-indigo-500' },
                { name: 'Banking', pct: 22, color: 'bg-blue-500' },
                { name: 'Tax', pct: 18, color: 'bg-amber-500' },
                { name: 'Payroll', pct: 14, color: 'bg-emerald-500' },
                { name: 'Forensic', pct: 12, color: 'bg-purple-500' },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-600">{cat.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`${cat.color} h-2 rounded-full`} style={{ width: `${cat.pct}%` }} />
                  </div>
                  <div className="w-8 text-xs text-gray-500 text-right">{cat.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProprietaryNotice />
    </div>
  );
}