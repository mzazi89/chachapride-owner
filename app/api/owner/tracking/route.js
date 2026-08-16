import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET() {
  const { response } = await guardRole('owner');
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.pickup, r.destination, r.pickup_lat, r.pickup_lng, r.destination_lat, r.destination_lng,
              r.status, r.driver_lat, r.driver_lng, r.driver_updated_at,
              rider.name AS rider_name, driver.name AS driver_name
       FROM rides r
       JOIN users rider ON rider.id = r.user_id
       LEFT JOIN users driver ON driver.id = r.driver_id
       WHERE r.status IN ('accepted', 'en_route')
       ORDER BY r.created_at DESC`
    );
    return NextResponse.json({ rides: rows });
  } catch (err) {
    console.error('[owner tracking] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
