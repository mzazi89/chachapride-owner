import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET() {
  const { response } = await guardRole('owner');
  if (response) return response;

  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT count(*)::int FROM rides) AS total_rides,
        (SELECT count(*)::int FROM rides WHERE status = 'completed') AS completed_rides,
        (SELECT COALESCE(sum(price), 0)::float FROM rides WHERE status = 'completed') AS total_revenue,
        (SELECT count(*)::int FROM rides WHERE status IN ('requested','accepted','en_route')) AS active_rides,
        (SELECT count(*)::int FROM users WHERE role = 'driver') AS total_drivers,
        (SELECT count(*)::int FROM drivers WHERE approved) AS approved_drivers,
        (SELECT count(*)::int FROM drivers WHERE status IN ('available','on_trip')) AS online_drivers
    `);
    return NextResponse.json({ stats: rows[0] });
  } catch (err) {
    console.error('[owner stats] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
