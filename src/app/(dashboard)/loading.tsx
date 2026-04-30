import { PageSpinner } from '@/components/shared/LoadingSkeleton'

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <PageSpinner label="Loading…" />
    </div>
  )
}
