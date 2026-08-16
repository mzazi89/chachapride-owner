import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { guardRole } from '../../../../../lib/guard';

export async function DELETE(request, { params }) {
  const { response } = await guardRole('owner');
  if (response) return response;

  const { id } = params;

  try {
    const { rows } = await pool.query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[owner messages delete] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
