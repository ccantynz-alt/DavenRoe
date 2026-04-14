import { useState } from 'react';

const CONTACT_METHODS = [
  {
    title: 'Sales & Demos',
    email: 'sales@davenroe.com',
    description: 'Book a personalised demo or discuss pricing for your firm.',
    responseTime: 'Within 4 hours',
  },
  {
    title: 'Technical Support',
    email: 'support@davenroe.com',
    description: 'Get help with platform features, integrations, or technical issues.',
    responseTime: 'Within 2 hours (Firm & Enterprise)',
  },
  {
    title: 'Security & Privacy',
    email: 'security@davenroe.com',
    description: 'Security inquiries, responsible disclosure, or data access requests.',
    responseTime: 'Within 24 hours',
  },
  {
    title: 'Partnerships & Integrations',
    email: 'partners@davenroe.com',
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
          <span className="text-xl font-semibold tracking-tight">DavenRoe</span>
        </div>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to homepage
        </button>
      </nav>

      <section className="py-20 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Get in touch</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Whether you want a demo, have a technical question, or want to explore a partnership — we're here.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">Message sent</h3>
                  <p className="text-green-700">We'll get back to you within one business day.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="jane@firm.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Firm Name</label>
                    <input
                      type="text"
                      value={form.firm}
                      onChange={e => setForm({ ...form, firm: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Smith & Associates"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">I'm interested in</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="demo">Booking a demo</option>
                      <option value="pricing">Pricing & plans</option>
                      <option value="migration">Migrating from another platform</option>
                      <option value="technical">Technical support</option>
                      <option value="partnership">Partnership opportunity</option>
                      <option value="other">Something else</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Tell us about your firm and what you're looking for..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              {CONTACT_METHODS.map((method, i) => (
                <div key={i} className="p-6 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">{method.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{method.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-600 font-medium">{method.email}</span>
                    <span className="text-xs text-gray-400">{method.responseTime}</span>
                  </div>
                </div>
              ))}

              <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">Office</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Level 20, 1 Martin Place<br />
                  Sydney NSW 2000<br />
                  Australia
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
