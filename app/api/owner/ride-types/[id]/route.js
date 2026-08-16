import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { guardRole } from '../../../../../lib/guard';

export async function POST(request, { params }) {
  const { response } = await guardRole('owner');
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const active = Boolean(body.active);
  const { id } = params;

  try {
    const { rows } = await pool.query(
      'UPDATE ride_types SET active = $1 WHERE id = $2 RETURNING id, active',
      [active, id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Ride type not found' }, { status: 404 });
    }
    return NextResponse.json({ active: rows[0].active });
  } catch (err) {
    console.error('[owner ride-types toggle] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
