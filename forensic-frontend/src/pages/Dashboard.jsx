export default function Dashboard() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Forensic Accounting</h2>
      <p className="text-slate-400 mb-8">
        M&A Due Diligence — Turn weeks of spreadsheet work into a 90-minute AI audit
      </p>

      {/* Capability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <CapabilityCard
          title="Benford's Law Analysis"
          description="Detect fabricated invoices, revenue inflation, and data manipulation using first/second digit distribution analysis"
          metric="Chi-squared + MAD conformity"
          status="active"
        />
        <CapabilityCard
          title="Anomaly Detection"
          description="Statistical outliers, timing patterns, round-number bias, month-end clustering"
          metric="Z-score + IQR analysis"
          status="active"
        />
        <CapabilityCard
          title="Vendor Cross-Reference"
          description="Ghost vendors, payment splitting, concentration risk, employee-vendor overlap"
          metric="Registry + pattern matching"
          status="active"
        />
        <CapabilityCard
          title="Payroll Verification"
          description="Cross-reference payroll vs tax filings, ghost employees, shared bank accounts"
          metric="Record matching + anomaly"
          status="active"
        />
        <CapabilityCard
          title="Money Trail Analysis"
          description="Cash flow patterns, circular transactions, revenue concentration, declining trends"
          metric="Flow graph + pattern"
          status="active"
        />
        <CapabilityCard
          title="AI Due Diligence Report"
          description="Complete forensic report with findings, risk scores, and Go/No-Go recommendation"
          metric="Claude-powered narrative"
          status="active"
        />
      </div>

      {/* Value Proposition */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ValueCard
          label="Traditional Cost"
          value="$50,000+"
          sublabel="Weeks of manual work"
          highlight={false}
        />
        <ValueCard
          label="Astra Forensic"
          value="$2,000"
          sublabel="90-minute AI audit"
          highlight={true}
        />
        <ValueCard
          label="Time Saved"
          value="96%"
          sublabel="Weeks → Minutes"
          highlight={false}
        />
      </div>

      {/* How it works */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h3 className="text-xl font-semibold mb-6">How the 90-Minute Audit Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Step num="1" title="Upload Data" desc="3 years of bank statements, payroll records, tax filings, vendor list" />
          <Step num="2" title="AI Analysis" desc="5 forensic engines run simultaneously — Benford's, anomalies, vendors, payroll, money trail" />
          <Step num="3" title="Findings" desc="Every flag includes severity, evidence, and financial impact estimate" />
          <Step num="4" title="Report" desc="AI generates a board-ready due diligence report with Go/No-Go recommendation" />
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({ title, description, metric, status }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-forensic-800 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-400 font-medium">
          {status}
        </span>
      </div>
      <h3 className="font-semibold text-lg mb-2 text-white">{title}</h3>
      <p className="text-sm text-slate-400 mb-3">{description}</p>
      <p className="text-xs text-slate-500 font-mono">{metric}</p>
    </div>
  );
}

function ValueCard({ label, value, sublabel, highlight }) {
  return (
    <div className={`rounded-xl p-6 border ${
      highlight
        ? 'bg-forensic-900/30 border-forensic-700'
        : 'bg-slate-900 border-slate-800'
    }`}>
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold mb-1 ${highlight ? 'text-forensic-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div>
      <div className="w-8 h-8 rounded-full bg-forensic-900/50 border border-forensic-700 flex items-center justify-center text-forensic-400 font-bold text-sm mb-3">
        {num}
      </div>
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
}
