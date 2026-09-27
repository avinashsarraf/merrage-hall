import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/feedback";

export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-16" />
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-4 w-32" />
          <div className="mt-5 flex h-44 items-end gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${40 + ((i * 37) % 55)}%` }} />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-28" />
          <div className="mt-8 flex justify-center">
            <Skeleton className="h-36 w-36 rounded-full" />
          </div>
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <Skeleton className="h-4 w-36" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
