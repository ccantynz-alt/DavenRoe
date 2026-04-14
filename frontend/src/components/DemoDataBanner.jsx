import { Link } from 'react-router-dom';

/**
 * DemoDataBanner — shown on feature preview pages that display
 * representative sample data rather than live customer data.
 *
 * Keeps the Zero-Tolerance Frontend Policy honest: visitors see
 * the product working, but are never misled about what's theirs.
 */
export default function DemoDataBanner({ feature = 'This page', ctaTo = '/clients', ctaLabel = 'Connect your data' }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900"
      >
        i
      </span>
      <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">Sample data.</span>{' '}
          {feature} is populated with representative demo figures so you can explore the workflow. Connect your entity to see your own numbers.
        </p>
        <Link
          to={ctaTo}
          className="inline-flex flex-shrink-0 items-center rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-50 transition-colors hover:bg-amber-800"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
