import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET() {
  const { response } = await guardRole('owner');
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              dr.license_number, dr.vehicle_model, dr.plate_number, dr.status, dr.approved,
              (SELECT count(*)::int FROM rides r WHERE r.driver_id = u.id AND r.status = 'completed') AS ride_count
       FROM users u
       JOIN drivers dr ON dr.user_id = u.id
       ORDER BY dr.approved ASC, u.created_at DESC`
    );
    return NextResponse.json({ drivers: rows });
  } catch (err) {
    console.error('[owner drivers] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
