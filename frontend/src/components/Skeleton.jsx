import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

export function Skeleton({ className = '' }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
  );
}

export function CardSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-40" />
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <Card className="overflow-hidden">
      <div className={cn('bg-gray-50 border-b px-4 py-3 flex gap-4')}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn('px-4 py-4 border-b flex gap-4')}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8')}>
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
      </div>
      <div className={cn('grid grid-cols-1 md:grid-cols-4 gap-6 mb-8')}>
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
