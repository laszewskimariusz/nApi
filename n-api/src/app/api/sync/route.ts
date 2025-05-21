// n-api/src/app/api/sync/route.ts

import { runFullSync } from '@/lib/sync';

export async function POST(request: Request) {
  try {
    const { startDate = '2022-11-18', endDate = '2022-11-20' } = await request.json().catch(() => ({}));

    const result = await runFullSync(startDate, endDate);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
