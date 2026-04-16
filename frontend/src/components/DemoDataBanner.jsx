import { Info } from 'lucide-react';

/**
 * Shown at the top of pages that are rendering demonstration/sample data
 * rather than the user's real transactions. Keeps us honest — prospects and
 * customers see this and know not to mistake demo numbers for their own.
 */
export default function DemoDataBanner({ featureName, emptyStateCta }) {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-amber-900">Showing demonstration data</div>
        <div className="text-xs text-amber-800 mt-0.5">
          {featureName} uses your real transaction data once you connect a bank feed or import history.
          {emptyStateCta && <> {emptyStateCta}</>}
        </div>
      </div>
    </div>
  );
}
