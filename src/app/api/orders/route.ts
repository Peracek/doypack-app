import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { Order, CreateOrderInput } from '@/types';

// GET /api/orders - List all orders
export async function GET() {
  try {
    const result = await pool.query<Order>(
      `SELECT id, order_code, material_type, print_coverage, package_size, sackovacka, note, created_at
       FROM orders
       ORDER BY created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const body: CreateOrderInput = await request.json();

    const { order_code, material_type, print_coverage, package_size, sackovacka, note } = body;

    // Validate required fields
    if (!order_code || !material_type || print_coverage === undefined || !package_size || !sackovacka) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await pool.query<Order>(
      `INSERT INTO orders (order_code, material_type, print_coverage, package_size, sackovacka, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, order_code, material_type, print_coverage, package_size, sackovacka, note, created_at`,
      [order_code, material_type, print_coverage, package_size, sackovacka, note || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);

    // Handle duplicate order_code
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Order code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
