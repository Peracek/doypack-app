import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { Order } from '@/types';

// GET /api/orders/[id] - Get order by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query<Order>(
      `SELECT id, order_code, material_type, print_coverage, package_size, sackovacka, note, created_at
       FROM orders
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
