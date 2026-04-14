/**
 * Proprietary notice footer — displayed on pages containing
 * proprietary technology, algorithms, or trade secrets.
 *
 * Usage: <ProprietaryNotice />
 */
export default function ProprietaryNotice() {
  return (
    <div className="mt-8 border-t pt-4">
      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        Proprietary and Confidential. The technology, algorithms, agent architecture, and analytical methods
        displayed on this page are the intellectual property of DavenRoe and are protected by copyright, trade
        secret law, and contractual obligations. Unauthorised reproduction, reverse engineering, or
        competitive analysis is prohibited under our <a href="/terms" className="underline">Terms of Service</a> and
        applicable law. Patent applications may be pending.
      </p>
    </div>
  );
}
