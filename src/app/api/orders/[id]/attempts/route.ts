import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { Attempt, CreateAttemptInput } from '@/types';

// GET /api/orders/[id]/attempts - Get all attempts for an order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query<Attempt>(
      `SELECT id, outcome, created_at,
              sealing_temperature_c, sealing_pressure_bar, dwell_time_s,
              zipper_temperature_c, zipper_pressure_bar, zipper_dwell_time_s,
              bottom_temperature_c, bottom_pressure_bar, bottom_dwell_time_s,
              side_e_temperature_c, side_e_pressure_bar, side_e_dwell_time_s,
              side_d_temperature_c, side_d_pressure_bar, side_d_dwell_time_s,
              side_c_temperature_c, side_c_pressure_bar, side_c_dwell_time_s,
              side_b_temperature_c, side_b_pressure_bar, side_b_dwell_time_s,
              side_a_temperature_c, side_a_pressure_bar, side_a_dwell_time_s,
              note
       FROM attempts
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}

// POST /api/orders/[id]/attempts - Create a new attempt
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CreateAttemptInput = await request.json();

    const {
      outcome,
      zipper_temperature_c,
      zipper_pressure_bar,
      zipper_dwell_time_s,
      bottom_temperature_c,
      bottom_pressure_bar,
      bottom_dwell_time_s,
      side_e_temperature_c,
      side_e_pressure_bar,
      side_e_dwell_time_s,
      side_d_temperature_c,
      side_d_pressure_bar,
      side_d_dwell_time_s,
      side_c_temperature_c,
      side_c_pressure_bar,
      side_c_dwell_time_s,
      side_b_temperature_c,
      side_b_pressure_bar,
      side_b_dwell_time_s,
      side_a_temperature_c,
      side_a_pressure_bar,
      side_a_dwell_time_s,
      note,
    } = body;

    // Validate required fields
    if (!outcome) {
      return NextResponse.json(
        { error: 'Missing required field: outcome' },
        { status: 400 }
      );
    }

    const result = await pool.query<Attempt>(
      `INSERT INTO attempts (
        order_id, outcome,
        zipper_temperature_c, zipper_pressure_bar, zipper_dwell_time_s,
        bottom_temperature_c, bottom_pressure_bar, bottom_dwell_time_s,
        side_e_temperature_c, side_e_pressure_bar, side_e_dwell_time_s,
        side_d_temperature_c, side_d_pressure_bar, side_d_dwell_time_s,
        side_c_temperature_c, side_c_pressure_bar, side_c_dwell_time_s,
        side_b_temperature_c, side_b_pressure_bar, side_b_dwell_time_s,
        side_a_temperature_c, side_a_pressure_bar, side_a_dwell_time_s,
        note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING id, outcome, created_at,
                zipper_temperature_c, zipper_pressure_bar, zipper_dwell_time_s,
                bottom_temperature_c, bottom_pressure_bar, bottom_dwell_time_s,
                side_e_temperature_c, side_e_pressure_bar, side_e_dwell_time_s,
                side_d_temperature_c, side_d_pressure_bar, side_d_dwell_time_s,
                side_c_temperature_c, side_c_pressure_bar, side_c_dwell_time_s,
                side_b_temperature_c, side_b_pressure_bar, side_b_dwell_time_s,
                side_a_temperature_c, side_a_pressure_bar, side_a_dwell_time_s,
                note`,
      [
        id,
        outcome,
        zipper_temperature_c,
        zipper_pressure_bar,
        zipper_dwell_time_s,
        bottom_temperature_c,
        bottom_pressure_bar,
        bottom_dwell_time_s,
        side_e_temperature_c,
        side_e_pressure_bar,
        side_e_dwell_time_s,
        side_d_temperature_c,
        side_d_pressure_bar,
        side_d_dwell_time_s,
        side_c_temperature_c,
        side_c_pressure_bar,
        side_c_dwell_time_s,
        side_b_temperature_c,
        side_b_pressure_bar,
        side_b_dwell_time_s,
        side_a_temperature_c,
        side_a_pressure_bar,
        side_a_dwell_time_s,
        note || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
}
