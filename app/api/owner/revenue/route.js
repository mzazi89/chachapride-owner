import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET(request) {
  const { response } = await guardRole('owner');
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const days = Math.min(30, Math.max(1, Number(searchParams.get('days')) || 7));

  try {
    const { rows } = await pool.query(
      `SELECT created_at::date AS day, COALESCE(sum(price), 0)::float AS revenue, count(*)::int AS trips
       FROM rides
       WHERE status = 'completed' AND created_at >= CURRENT_DATE - ($1 - 1) * INTERVAL '1 day'
       GROUP BY created_at::date
       ORDER BY day ASC`,
      [days]
    );

    // zero-fill missing days so the chart is continuous
    const byDay = {};
    for (const r of rows) byDay[r.day.toISOString().slice(0, 10)] = r;
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      series.push({
        day: key,
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        revenue: byDay[key]?.revenue ?? 0,
        trips: byDay[key]?.trips ?? 0,
      });
    }

    return NextResponse.json({ series, total: series.reduce((s, x) => s + x.revenue, 0) });
  } catch (err) {
    console.error('[owner revenue] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
