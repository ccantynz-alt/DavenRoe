import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const JURISDICTIONS = [
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', authority: 'ATO' },
  { code: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', authority: 'IRD' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', authority: 'HMRC' },
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', authority: 'IRS' },
];

const QUICK_QUESTIONS = [
  'What expenses can I claim?',
  'Can I claim bank fees?',
  'How do I claim vehicle expenses?',
  'What are the current tax rates?',
  'Can I claim home office expenses?',
  'When are tax returns due?',
  'What is the GST/VAT threshold?',
  'How does superannuation/401(k) work?',
];

export default function TaxAgent() {
  const [jurisdiction, setJurisdiction] = useState('AU');
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bankFees, setBankFees] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [showBankFees, setShowBankFees] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const toast = useToast();

  const currentJur = JURISDICTIONS.find(j => j.code === jurisdiction);

  const askQuestion = async (q) => {
    const text = q || question;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setConversation(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/tax-agent/ask', { question: text, jurisdiction });
      const botMsg = {
        role: 'assistant',
        content: res.data.answer,
        jurisdiction: res.data.jurisdiction,
        authority: res.data.authority,
        topic: res.data.topic,
        sources: res.data.sources,
        related_topics: res.data.related_topics,
        disclaimer: res.data.disclaimer,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, botMsg]);
    } catch (err) {
      toast.error('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const loadBankFees = async () => {
    try {
      const res = await api.get(`/tax-agent/bank-fees/${jurisdiction}`);
      setBankFees(res.data);
      setShowBankFees(true);
    } catch { toast.error('Failed to load bank fee rules'); }
  };

  const loadExpenses = async () => {
    try {
      const res = await api.get(`/tax-agent/expenses/${jurisdiction}`);
      setExpenses(res.data.categories);
      setShowExpenses(true);
    } catch { toast.error('Failed to load expense categories'); }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Tax Agent</h2>
        <p className="text-gray-500 mt-1">Ask questions about tax deductions, claimable expenses, limits, and compliance</p>
      </div>

      {/* Jurisdiction selector */}
      <div className="flex gap-2 mb-6">
        {JURISDICTIONS.map(j => (
          <button key={j.code} onClick={() => { setJurisdiction(j.code); setBankFees(null); setExpenses(null); setShowBankFees(false); setShowExpenses(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              jurisdiction === j.code
                ? 'bg-indigo-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}>
            <span>{j.flag}</span>
            <span className="hidden sm:inline">{j.name}</span>
            <span className="sm:hidden">{j.code}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2">
          {/* Conversation */}
          <div className="bg-white border rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {conversation.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ask me about {currentJur?.name} tax</h3>
                  <p className="text-sm text-gray-500 mb-6">I know about deductions, claimable expenses, tax rates, deadlines, bank fees, and more</p>

                  <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button key={i} onClick={() => askQuestion(q)}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {conversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}>
                    {msg.role === 'assistant' && msg.authority && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                        <span className="text-xs font-medium text-indigo-600">{msg.authority}</span>
                        <span className="text-xs text-gray-400">{msg.topic?.replace('_', ' ')}</span>
                      </div>
                    )}

                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content.split('\n').map((line, li) => {
                        // Simple markdown-ish rendering
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={li} className="font-bold mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (line.startsWith('- ')) {
                          return <p key={li} className="ml-4">{line}</p>;
                        }
                        if (line.startsWith('**') && line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={li} className="mt-1">
                              {parts.map((part, pi) => pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part)}
                            </p>
                          );
                        }
                        return line ? <p key={li}>{line}</p> : <br key={li} />;
                      })}
                    </div>

                    {msg.role === 'assistant' && msg.disclaimer && (
                      <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-200 italic">
                        {msg.disclaimer}
                      </p>
                    )}

                    {msg.role === 'assistant' && msg.related_topics?.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <p className="text-[10px] text-gray-400 mb-1">Related topics:</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.related_topics.slice(0, 4).map((t, ti) => (
                            <button key={ti} onClick={() => askQuestion(`Tell me about ${t.toLowerCase()}`)}
                              className="text-[10px] px-2 py-0.5 bg-white border rounded-full text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <form onSubmit={e => { e.preventDefault(); askQuestion(); }} className="flex gap-2">
                <input value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder={`Ask about ${currentJur?.name} tax...`}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                  disabled={loading} />
                <button type="submit" disabled={loading || !question.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  Ask
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Quick Lookups</h3>
            <div className="space-y-2">
              <button onClick={loadBankFees}
                className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                Bank Fee Rules ({currentJur?.code})
              </button>
              <button onClick={loadExpenses}
                className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                All Claimable Expenses ({currentJur?.code})
              </button>
              <button onClick={() => askQuestion('What are the current tax rates?')}
                className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                Tax Rates & Brackets
              </button>
              <button onClick={() => askQuestion('When are tax returns due?')}
                className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                Key Dates & Deadlines
              </button>
            </div>
          </div>

          {/* Bank fees panel */}
          {showBankFees && bankFees && (
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Bank Fees — {bankFees.jurisdiction}</h3>
                <button onClick={() => setShowBankFees(false)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
              </div>

              <div className={`text-xs font-medium px-2 py-1 rounded mb-3 inline-block ${
                bankFees.deductible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {bankFees.deductible ? 'Generally Deductible' : 'Not Deductible'}
              </div>

              {bankFees.deductible_fees?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-green-600 mb-1">Deductible:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {bankFees.deductible_fees.map((f, i) => (
                      <li key={i} className="flex gap-1"><span className="text-green-500 mt-0.5">+</span> {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bankFees.non_deductible_fees?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-red-500 mb-1">NOT Deductible:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {bankFees.non_deductible_fees.map((f, i) => (
                      <li key={i} className="flex gap-1"><span className="text-red-400 mt-0.5">-</span> {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bankFees.apportionment_rule && (
                <p className="text-xs text-gray-500 mt-2 p-2 bg-amber-50 rounded">
                  <strong>Mixed-use:</strong> {bankFees.apportionment_rule}
                </p>
              )}
            </div>
          )}

          {/* Expenses panel */}
          {showExpenses && expenses && (
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Expense Categories</h3>
                <button onClick={() => setShowExpenses(false)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
              </div>
              <div className="space-y-2">
                {expenses.map((cat, i) => (
                  <button key={i}
                    onClick={() => askQuestion(`Tell me about ${cat.name} deductions`)}
                    className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    {cat.deductible !== undefined && (
                      <p className={`text-[10px] ${cat.deductible ? 'text-green-600' : 'text-red-500'}`}>
                        {cat.deductible ? 'Deductible' : 'Conditions apply'}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Disclaimer:</strong> This is general guidance only and does not constitute tax advice.
              Tax laws change frequently. Please consult a qualified tax professional for advice specific to your circumstances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
