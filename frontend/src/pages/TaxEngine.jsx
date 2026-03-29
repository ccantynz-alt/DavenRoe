import { useState } from 'react';
import { motion } from 'framer-motion';
import { calculateGST, calculateWHT, getTreaties } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function TaxEngine() {
  const [activeTab, setActiveTab] = useState('gst');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // GST form
  const [gstJurisdiction, setGstJurisdiction] = useState('AU');
  const [gstAmount, setGstAmount] = useState('1000');

  // WHT form
  const [whtPayer, setWhtPayer] = useState('US');
  const [whtPayee, setWhtPayee] = useState('NZ');
  const [whtAmount, setWhtAmount] = useState('10000');
  const [whtType, setWhtType] = useState('services');

  const handleGST = async () => {
    setLoading(true);
    try {
      const res = await calculateGST({ jurisdiction: gstJurisdiction, net_amount: parseFloat(gstAmount) });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleWHT = async () => {
    setLoading(true);
    try {
      const res = await calculateWHT({
        payer_country: whtPayer,
        payee_country: whtPayee,
        gross_amount: parseFloat(whtAmount),
        income_type: whtType,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleTreaties = async () => {
    setLoading(true);
    try {
      const res = await getTreaties();
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setResult(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold mb-2">Tax Engine</h2>
      <p className="text-gray-500 mb-6">Deterministic tax calculations based on published legislation</p>

      <Card className="mb-8 border-amber-200 bg-amber-50 shadow-none hover:shadow-none">
        <CardContent className="px-4 py-2.5 pt-2.5">
          <p className="text-xs text-amber-700">
            Tax calculations are based on published rates and rules as of the date shown. Tax law is subject to change, interpretation, and jurisdiction-specific exceptions. These calculations are for informational purposes only and do not constitute tax advice. Always verify with a qualified tax professional before filing.
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList>
          <TabsTrigger value="gst">GST / VAT</TabsTrigger>
          <TabsTrigger value="wht">Cross-Border WHT</TabsTrigger>
          <TabsTrigger value="treaties">Tax Treaties</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Input Card */}
          <Card>
            <TabsContent value="gst" className="mt-0">
              <CardHeader>
                <CardTitle>Calculate GST / VAT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                  <Select value={gstJurisdiction} onValueChange={setGstJurisdiction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AU">Australia (10% GST)</SelectItem>
                      <SelectItem value="NZ">New Zealand (15% GST)</SelectItem>
                      <SelectItem value="GB">United Kingdom (20% VAT)</SelectItem>
                      <SelectItem value="US">United States (No federal GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount</label>
                  <Input
                    type="number"
                    value={gstAmount}
                    onChange={(e) => setGstAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleGST} disabled={loading} className="w-full">
                  {loading ? 'Calculating...' : 'Calculate'}
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="wht" className="mt-0">
              <CardHeader>
                <CardTitle>Cross-Border Withholding Tax</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payer Country</label>
                    <Select value={whtPayer} onValueChange={setWhtPayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="NZ">New Zealand</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payee Country</label>
                    <Select value={whtPayee} onValueChange={setWhtPayee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NZ">New Zealand</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gross Amount</label>
                  <Input
                    type="number"
                    value={whtAmount}
                    onChange={(e) => setWhtAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Type</label>
                  <Select value={whtType} onValueChange={setWhtType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="dividends">Dividends</SelectItem>
                      <SelectItem value="interest">Interest</SelectItem>
                      <SelectItem value="royalties">Royalties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleWHT} disabled={loading} className="w-full">
                  {loading ? 'Calculating...' : 'Calculate WHT'}
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="treaties" className="mt-0">
              <CardHeader>
                <CardTitle>Double Tax Agreements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">
                  View all 6 bilateral DTAs loaded in the engine (US, AU, NZ, GB).
                </p>
                <Button onClick={handleTreaties} disabled={loading} className="w-full">
                  {loading ? 'Loading...' : 'Load Treaties'}
                </Button>
              </CardContent>
            </TabsContent>
          </Card>

          {/* Result Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Result</CardTitle>
                {result && !result.error && (
                  <Badge variant="success">Calculated</Badge>
                )}
                {result?.error && (
                  <Badge variant="destructive">Error</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <motion.pre
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm bg-gray-50 rounded-lg p-4 overflow-auto whitespace-pre-wrap"
                >
                  {JSON.stringify(result, null, 2)}
                </motion.pre>
              ) : (
                <p className="text-gray-400 text-sm">Run a calculation to see results</p>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </motion.div>
  );
}
