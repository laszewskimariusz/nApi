import { runFullSync } from '@/lib/sync';

export async function POST(request: Request) {
  // opcjonalnie możesz odczytać parametry z body requestu
  const { startDate, endDate } = await request.json().catch(() => ({}));
  
  const result = await runFullSync(startDate, endDate);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
