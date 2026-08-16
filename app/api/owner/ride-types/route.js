import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

export async function GET() {
  const { response } = await guardRole('owner');
  if (response) return response;

  try {
    const { rows } = await pool.query(
      'SELECT id, name, icon, base_price, per_km, capacity, description, active FROM ride_types ORDER BY base_price ASC'
    );
    return NextResponse.json({ rideTypes: rows });
  } catch (err) {
    console.error('[owner ride-types GET] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { response } = await guardRole('owner');
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const id = String(body.id ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  const name = String(body.name ?? '').trim();
  const basePrice = Number(body.basePrice);
  const perKm = Number(body.perKm);
  const capacity = Number(body.capacity) || 4;
  const description = String(body.description ?? '').trim();
  const icon = String(body.icon ?? '🚗').trim() || '🚗';
  const active = body.active !== false;

  if (!id || !name || !Number.isFinite(basePrice) || !Number.isFinite(perKm)) {
    return NextResponse.json(
      { error: 'id, name, basePrice and perKm are required' },
      { status: 400 }
    );
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO ride_types (id, name, icon, base_price, per_km, capacity, description, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, icon = EXCLUDED.icon, base_price = EXCLUDED.base_price,
         per_km = EXCLUDED.per_km, capacity = EXCLUDED.capacity,
         description = EXCLUDED.description, active = EXCLUDED.active
       RETURNING id, name, base_price, per_km, active`,
      [id, name, icon, basePrice, perKm, capacity, description, active]
    );
    return NextResponse.json({ rideType: rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[owner ride-types POST] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
