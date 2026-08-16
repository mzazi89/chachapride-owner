import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET() {
  const { response } = await guardRole('owner');
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT cs.id, cs.amount, cs.status, cs.deposited_at, cs.verified_at, cs.created_at,
              d.name AS driver_name, d.email AS driver_email, d.phone AS driver_phone,
              r.pickup, r.destination, r.ride_type, r.price
       FROM cash_settlements cs
       JOIN users d ON d.id = cs.driver_id
       JOIN rides r ON r.id = cs.ride_id
       ORDER BY cs.created_at DESC`
    );

    const { rows: totals } = await pool.query(
      `SELECT COALESCE(sum(amount) FILTER (WHERE status = 'pending'), 0)::float AS total_pending,
              COALESCE(sum(amount) FILTER (WHERE status = 'deposited'), 0)::float AS total_deposited,
              COALESCE(sum(amount) FILTER (WHERE status = 'verified'), 0)::float AS total_verified
       FROM cash_settlements`
    );

    return NextResponse.json({ settlements: rows, totals: totals[0] });
  } catch (err) {
    console.error('[owner settlements] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
