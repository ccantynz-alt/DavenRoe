/**
 * Proprietary notice footer — displayed on pages containing
 * proprietary technology, algorithms, or trade secrets.
 *
 * Usage: <ProprietaryNotice />
 */
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ProprietaryNotice() {
  return (
    <Card className={cn('mt-8 border-t border-gray-200 shadow-none bg-transparent border-x-0 border-b-0 rounded-none')}>
      <CardContent className="pt-4 pb-0 px-0">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          Proprietary and Confidential. The technology, algorithms, agent architecture, and analytical methods
          displayed on this page are the intellectual property of Astra and are protected by copyright, trade
          secret law, and contractual obligations. Unauthorised reproduction, reverse engineering, or
          competitive analysis is prohibited under our <a href="/terms" className="underline">Terms of Service</a> and
          applicable law. Patent applications may be pending.
        </p>
      </CardContent>
    </Card>
  );
}
