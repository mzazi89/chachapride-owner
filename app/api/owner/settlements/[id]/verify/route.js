import { NextResponse } from 'next/server';
import pool from '../../../../../../lib/db';
import { guardRole } from '../../../../../../lib/guard';

// Owner confirms the driver's commission deposit was received
export async function POST(request, { params }) {
  const { response } = await guardRole('owner');
  if (response) return response;

  const { id } = params;

  try {
    const { rows } = await pool.query(
      `UPDATE cash_settlements SET status = 'verified', verified_at = now()
       WHERE id = $1 AND status = 'deposited'
       RETURNING id, status, verified_at`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Settlement not found or not in deposited state' },
        { status: 404 }
      );
    }
    return NextResponse.json({ settlement: rows[0] });
  } catch (err) {
    console.error('[owner verify] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
