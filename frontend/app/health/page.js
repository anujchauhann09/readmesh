'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

const fetchHealth = async () => {
  const { data } = await apiClient.get('/health');
  return data; // { success, data: { status, uptimeSeconds, timestamp, services } }
};

export default function HealthPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  const health = data?.data;
  const ok = health?.status === 'ok';

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System status</h1>
        <p className="text-sm text-muted-foreground">
          End-to-end check: frontend → backend → database.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
        {isPending && <p className="text-muted-foreground">Checking…</p>}

        {isError && (
          <p className="text-destructive">
            {error?.message ?? 'Could not reach the API.'}{' '}
            <span className="text-muted-foreground">({error?.code})</span>
          </p>
        )}

        {health && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  ok ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                aria-hidden
              />
              <span className="font-medium capitalize">{health.status}</span>
            </div>
            <dl className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
              <dt>Database</dt>
              <dd className="text-right capitalize text-foreground">{health.services?.database}</dd>
              <dt>Uptime</dt>
              <dd className="text-right text-foreground">{health.uptimeSeconds}s</dd>
              <dt>Checked at</dt>
              <dd className="text-right text-foreground">
                {new Date(health.timestamp).toLocaleTimeString()}
              </dd>
            </dl>
          </div>
        )}
      </div>

      <Button onClick={() => refetch()} disabled={isFetching} className="self-start">
        {isFetching ? 'Refreshing…' : 'Refresh'}
      </Button>
    </main>
  );
}
