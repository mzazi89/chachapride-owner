import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET(request) {
  const { response } = await guardRole('owner');
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? 'WHERE r.status = $1' : '';
    const values = status ? [status] : [];

    const { rows } = await pool.query(
      `SELECT r.id, r.pickup, r.destination, r.ride_type, r.price, r.status, r.created_at,
              rider.name AS rider_name, rider.email AS rider_email,
              driver.name AS driver_name
       FROM rides r
       JOIN users rider ON rider.id = r.user_id
       LEFT JOIN users driver ON driver.id = r.driver_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT 200`,
      values
    );

    return NextResponse.json({ rides: rows });
  } catch (err) {
    console.error('[owner rides] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
