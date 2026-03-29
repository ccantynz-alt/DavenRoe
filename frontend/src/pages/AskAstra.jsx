import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAstra } from '@/services/api';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function AskAstra() {
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
      const res = await askAstra(userMsg);
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
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-3xl font-bold">Ask Astra</h2>
        <p className="text-gray-500 mt-1">Ask anything about your finances in plain English</p>
        <LegalDisclaimer type="ai" className="mt-3" />
      </motion.div>

      {/* Suggestions */}
      <AnimatePresence>
        {conversation.length === 0 && (
          <motion.div
            className="grid grid-cols-2 gap-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {suggestedQueries.map((q, i) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:border-astra-400 hover:bg-astra-50 transition-colors"
                  onClick={() => setQuery(q)}
                >
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">{q}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation */}
      <div className="flex-1 overflow-auto space-y-4 mb-4">
        <AnimatePresence>
          {conversation.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={cn(
                  msg.role === 'user'
                    ? 'bg-astra-100 border-astra-200 ml-12'
                    : 'bg-white mr-12'
                )}
              >
                <CardContent className="p-4">
                  {msg.role === 'user' ? (
                    <p className="text-astra-900">{msg.content}</p>
                  ) : (
                    <div>
                      <Badge variant="default" className="mb-2">Astra</Badge>
                      <p className="text-gray-700">{msg.content.summary}</p>
                      {msg.content.key_metrics?.length > 0 && (
                        <div className="flex gap-4 mt-3">
                          {msg.content.key_metrics.map((m, j) => (
                            <Badge key={j} variant="secondary" className="px-3 py-2 text-sm rounded-lg">
                              <span className="text-gray-500">{m.label}: </span>
                              <span className="font-semibold">{m.value}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {msg.content.alerts?.length > 0 && (
                        <Card className="mt-3 bg-yellow-50 border-yellow-200">
                          <CardContent className="p-3">
                            {msg.content.alerts.map((a, j) => (
                              <p key={j} className="text-sm text-yellow-800">{a}</p>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mr-12 animate-pulse">
              <CardContent className="p-4">
                <p className="text-gray-400">Astra is thinking...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-3">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-1 h-12 rounded-xl px-4 text-sm"
        />
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          size="lg"
          className="rounded-xl px-6"
        >
          Ask
        </Button>
      </form>
    </div>
  );
}
