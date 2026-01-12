import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" label="Загрузка панели управления..." />
    </div>
  );
}
