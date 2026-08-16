import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET() {
  const { response } = await guardRole('owner');
  if (response) return response;

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 200'
    );
    return NextResponse.json({ messages: rows });
  } catch (err) {
    console.error('[owner messages] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
