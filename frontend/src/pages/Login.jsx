import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('bookkeeper');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (showReset) {
        const res = await fetch('/api/v1/auth/password-reset/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setSuccess(data.message);
        setShowReset(false);
      } else if (isRegister) {
        await register(email, password, fullName, role);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Astra</h1>
          <p className="text-gray-500 mt-2">Autonomous Global Accounting</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {showReset ? 'Reset Password' : isRegister ? 'Create Account' : 'Sign In'}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {!showReset && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required={!showReset}
                    />
                  </div>
                )}

                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="senior">Senior Accountant</SelectItem>
                        <SelectItem value="bookkeeper">Bookkeeper</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Please wait...' : showReset ? 'Send Reset Link' : isRegister ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                {!isRegister && !showReset && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowReset(true); setError(''); setSuccess(''); }}
                    className="text-sm text-gray-500 hover:text-gray-700 block mx-auto"
                  >
                    Forgot your password?
                  </Button>
                )}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => { setIsRegister(!isRegister); setShowReset(false); setError(''); setSuccess(''); }}
                >
                  {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Protected by 256-bit encryption. Your data never leaves our secure infrastructure.
        </p>
      </div>
    </div>
  );
}
