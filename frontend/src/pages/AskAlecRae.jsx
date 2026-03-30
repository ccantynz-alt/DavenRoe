import { useState } from 'react';
import { askAlecRae } from '../services/api';
import LegalDisclaimer from '../components/LegalDisclaimer';

export default function AskAlecRae() {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setConversation((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await askAlecRae(userMsg);
      setConversation((prev) => [...prev, { role: 'astra', content: res.data }]);
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        { role: 'astra', content: { summary: 'Unable to process query. Is the backend running?' } },
      ]);
    }
    setLoading(false);
  };

  const suggestedQueries = [
    'How much did I spend on SaaS last month?',
    'What is my GST liability this quarter?',
    'Summarize my cash flow for the last 90 days.',
    'Compare my AU vs NZ tax obligations.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Ask AlecRae</h2>
        <p className="text-gray-500 mt-1">Ask anything about your finances in plain English</p>
        <LegalDisclaimer type="ai" className="mt-3" />
      </div>

      {/* Suggestions */}
      {conversation.length === 0 && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {suggestedQueries.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="text-left bg-white border rounded-xl p-4 text-sm text-gray-600 hover:border-astra-400 hover:bg-astra-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Conversation */}
      <div className="flex-1 overflow-auto space-y-4 mb-4">
        {conversation.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 ${
              msg.role === 'user'
                ? 'bg-astra-100 text-astra-900 ml-12'
                : 'bg-white border mr-12'
            }`}
          >
            {msg.role === 'user' ? (
              <p>{msg.content}</p>
            ) : (
              <div>
                <p className="font-semibold text-sm text-astra-600 mb-2">AlecRae</p>
                <p className="text-gray-700">{msg.content.summary}</p>
                {msg.content.key_metrics?.length > 0 && (
                  <div className="flex gap-4 mt-3">
                    {msg.content.key_metrics.map((m, j) => (
                      <div key={j} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-500">{m.label}: </span>
                        <span className="font-semibold">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.content.alerts?.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    {msg.content.alerts.map((a, j) => (
                      <p key={j}>{a}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-white border rounded-xl p-4 mr-12 animate-pulse">
            <p className="text-gray-400">AlecRae is thinking...</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-astra-400"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-astra-600 text-white rounded-xl font-medium hover:bg-astra-700 disabled:opacity-50 transition-colors"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
