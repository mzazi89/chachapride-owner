import { NextResponse } from 'next/server';
import pool from '../../../../../../lib/db';
import { guardRole } from '../../../../../../lib/guard';

export async function POST(request, { params }) {
  const { response } = await guardRole('owner');
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const approved = Boolean(body.approved);
  const { id } = params;

  try {
    const { rows } = await pool.query(
      'UPDATE drivers SET approved = $1 WHERE user_id = $2 RETURNING approved',
      [approved, id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    return NextResponse.json({ approved: rows[0].approved });
  } catch (err) {
    console.error('[owner approve] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
