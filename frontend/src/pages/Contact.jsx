import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.1 },
  }),
};

const CONTACT_METHODS = [
  {
    title: 'Sales & Demos',
    email: 'sales@astra.ai',
    description: 'Book a personalised demo or discuss pricing for your firm.',
    responseTime: 'Within 4 hours',
  },
  {
    title: 'Technical Support',
    email: 'support@astra.ai',
    description: 'Get help with platform features, integrations, or technical issues.',
    responseTime: 'Within 2 hours (Firm & Enterprise)',
  },
  {
    title: 'Security & Privacy',
    email: 'security@astra.ai',
    description: 'Security inquiries, responsible disclosure, or data access requests.',
    responseTime: 'Within 24 hours',
  },
  {
    title: 'Partnerships & Integrations',
    email: 'partners@astra.ai',
    description: 'Integration partnerships, reseller programmes, or API access.',
    responseTime: 'Within 48 hours',
  },
];

export default function Contact({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', firm: '', subject: 'demo', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <nav className="flex items-center justify-between px-6 lg:px-16 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Astra</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Back to homepage
        </Button>
      </nav>

      <section className="py-20 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Get in touch</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Whether you want a demo, have a technical question, or want to explore a partnership — we're here.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeUp}
              custom={1}
            >
              {submitted ? (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">Message sent</h3>
                    <p className="text-green-700">We'll get back to you within one business day.</p>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                      <Input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
                      <Input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@firm.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Firm Name</label>
                    <Input
                      type="text"
                      value={form.firm}
                      onChange={e => setForm({ ...form, firm: e.target.value })}
                      placeholder="Smith & Associates"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">I'm interested in</label>
                    <Select value={form.subject} onValueChange={(val) => setForm({ ...form, subject: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Booking a demo</SelectItem>
                        <SelectItem value="pricing">Pricing & plans</SelectItem>
                        <SelectItem value="migration">Migrating from another platform</SelectItem>
                        <SelectItem value="technical">Technical support</SelectItem>
                        <SelectItem value="partnership">Partnership opportunity</SelectItem>
                        <SelectItem value="other">Something else</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className={cn(
                        'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors',
                        'placeholder:text-gray-400',
                        'focus:border-astra-500 focus:outline-none focus:ring-2 focus:ring-astra-500/20',
                        'resize-none'
                      )}
                      placeholder="Tell us about your firm and what you're looking for..."
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    Send Message
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact Methods */}
            <div className="space-y-6">
              {CONTACT_METHODS.map((method, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  variants={fadeUp}
                  custom={i}
                >
                  <Card className={cn('hover:border-indigo-100')}>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-gray-900 mb-1">{method.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">{method.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-indigo-600 font-medium">{method.email}</span>
                        <Badge variant="secondary">{method.responseTime}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={fadeUp}
                custom={4}
              >
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2">Office</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Level 20, 1 Martin Place<br />
                      Sydney NSW 2000<br />
                      Australia
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
