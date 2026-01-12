import { SkeletonTable } from '@/components/ui/Skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <SkeletonTable rows={10} columns={5} />
    </div>
  );
}
