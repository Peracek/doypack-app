'use server';

import pool from '@/lib/db';
import type { Order, Attempt, CreateOrderInput, CreateAttemptInput } from '@/types';
import { revalidatePath } from 'next/cache';

// Orders
export async function getOrders(): Promise<Order[]> {
  const result = await pool.query<Order>(
    `SELECT id, order_code, material_type, print_coverage, package_size, sackovacka, note, created_at
     FROM orders
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getOrder(id: number): Promise<Order | null> {
  const result = await pool.query<Order>(
    `SELECT id, order_code, material_type, print_coverage, package_size, sackovacka, note, created_at
     FROM orders
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createOrder(data: CreateOrderInput): Promise<{ success: boolean; order?: Order; error?: string }> {
  const { order_code, material_type, print_coverage, package_size, sackovacka, note } = data;

  // Validate required fields
  if (!order_code || !material_type || print_coverage === undefined || !package_size || !sackovacka) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const result = await pool.query<Order>(
      `INSERT INTO orders (order_code, material_type, print_coverage, package_size, sackovacka, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, order_code, material_type, print_coverage, package_size, sackovacka, note, created_at`,
      [order_code, material_type, print_coverage, package_size, sackovacka, note || null]
    );

    revalidatePath('/');
    return { success: true, order: result.rows[0] };
  } catch (error: any) {
    console.error('Error creating order:', error);

    // Handle duplicate order_code
    if (error.code === '23505') {
      return { success: false, error: 'Order code already exists' };
    }

    return { success: false, error: 'Failed to create order' };
  }
}

// Attempts
export async function getAttempts(orderId: number): Promise<Attempt[]> {
  const result = await pool.query<Attempt>(
    `SELECT id, outcome, created_at,
            sealing_temperature_c, sealing_pressure_bar, dwell_time_s,
            zipper_temperature_c, zipper_pressure_bar, zipper_dwell_time_s,
            bottom_temperature_c, bottom_pressure_bar, bottom_dwell_time_s,
            side_e_temperature_c, side_e_temperature_upper_c, side_e_temperature_lower_c, side_e_pressure_bar, side_e_dwell_time_s, side_e_setup,
            side_d_temperature_c, side_d_temperature_upper_c, side_d_temperature_lower_c, side_d_pressure_bar, side_d_dwell_time_s, side_d_setup,
            side_c_temperature_c, side_c_temperature_upper_c, side_c_temperature_lower_c, side_c_pressure_bar, side_c_dwell_time_s, side_c_setup,
            side_b_temperature_c, side_b_temperature_upper_c, side_b_temperature_lower_c, side_b_pressure_bar, side_b_dwell_time_s, side_b_setup,
            side_a_temperature_c, side_a_temperature_upper_c, side_a_temperature_lower_c, side_a_pressure_bar, side_a_dwell_time_s, side_a_setup,
            note
     FROM attempts
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId]
  );
  return result.rows;
}

export async function createAttempt(orderId: number, data: CreateAttemptInput): Promise<{ success: boolean; attempt?: Attempt; error?: string }> {
  const {
    outcome,
    zipper_temperature_c,
    zipper_pressure_bar,
    zipper_dwell_time_s,
    bottom_temperature_c,
    bottom_pressure_bar,
    bottom_dwell_time_s,
    side_e_setup,
    side_e_temperature_upper_c,
    side_e_temperature_lower_c,
    side_e_pressure_bar,
    side_e_dwell_time_s,
    side_d_setup,
    side_d_temperature_upper_c,
    side_d_temperature_lower_c,
    side_d_pressure_bar,
    side_d_dwell_time_s,
    side_c_setup,
    side_c_temperature_upper_c,
    side_c_temperature_lower_c,
    side_c_pressure_bar,
    side_c_dwell_time_s,
    side_b_setup,
    side_b_temperature_upper_c,
    side_b_temperature_lower_c,
    side_b_pressure_bar,
    side_b_dwell_time_s,
    side_a_setup,
    side_a_temperature_upper_c,
    side_a_temperature_lower_c,
    side_a_pressure_bar,
    side_a_dwell_time_s,
    note,
  } = data;

  // Validate required fields
  if (!outcome) {
    return { success: false, error: 'Missing required field: outcome' };
  }

  try {
    const result = await pool.query<Attempt>(
      `INSERT INTO attempts (
        order_id, outcome,
        zipper_temperature_c, zipper_pressure_bar, zipper_dwell_time_s,
        bottom_temperature_c, bottom_pressure_bar, bottom_dwell_time_s,
        side_e_setup, side_e_temperature_upper_c, side_e_temperature_lower_c, side_e_pressure_bar, side_e_dwell_time_s,
        side_d_setup, side_d_temperature_upper_c, side_d_temperature_lower_c, side_d_pressure_bar, side_d_dwell_time_s,
        side_c_setup, side_c_temperature_upper_c, side_c_temperature_lower_c, side_c_pressure_bar, side_c_dwell_time_s,
        side_b_setup, side_b_temperature_upper_c, side_b_temperature_lower_c, side_b_pressure_bar, side_b_dwell_time_s,
        side_a_setup, side_a_temperature_upper_c, side_a_temperature_lower_c, side_a_pressure_bar, side_a_dwell_time_s,
        note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37)
      RETURNING id, outcome, created_at,
                zipper_temperature_c, zipper_pressure_bar, zipper_dwell_time_s,
                bottom_temperature_c, bottom_pressure_bar, bottom_dwell_time_s,
                side_e_setup, side_e_temperature_upper_c, side_e_temperature_lower_c, side_e_pressure_bar, side_e_dwell_time_s,
                side_d_setup, side_d_temperature_upper_c, side_d_temperature_lower_c, side_d_pressure_bar, side_d_dwell_time_s,
                side_c_setup, side_c_temperature_upper_c, side_c_temperature_lower_c, side_c_pressure_bar, side_c_dwell_time_s,
                side_b_setup, side_b_temperature_upper_c, side_b_temperature_lower_c, side_b_pressure_bar, side_b_dwell_time_s,
                side_a_setup, side_a_temperature_upper_c, side_a_temperature_lower_c, side_a_pressure_bar, side_a_dwell_time_s,
                note`,
      [
        orderId,
        outcome,
        zipper_temperature_c,
        zipper_pressure_bar,
        zipper_dwell_time_s,
        bottom_temperature_c,
        bottom_pressure_bar,
        bottom_dwell_time_s,
        side_e_setup,
        side_e_temperature_upper_c,
        side_e_temperature_lower_c,
        side_e_pressure_bar,
        side_e_dwell_time_s,
        side_d_setup,
        side_d_temperature_upper_c,
        side_d_temperature_lower_c,
        side_d_pressure_bar,
        side_d_dwell_time_s,
        side_c_setup,
        side_c_temperature_upper_c,
        side_c_temperature_lower_c,
        side_c_pressure_bar,
        side_c_dwell_time_s,
        side_b_setup,
        side_b_temperature_upper_c,
        side_b_temperature_lower_c,
        side_b_pressure_bar,
        side_b_dwell_time_s,
        side_a_setup,
        side_a_temperature_upper_c,
        side_a_temperature_lower_c,
        side_a_pressure_bar,
        side_a_dwell_time_s,
        note || null,
      ]
    );

    revalidatePath(`/orders/${orderId}`);
    return { success: true, attempt: result.rows[0] };
  } catch (error) {
    console.error('Error creating attempt:', error);
    return { success: false, error: 'Failed to create attempt' };
  }
}

export async function deleteAttempt(attemptId: number, orderId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(
      'DELETE FROM attempts WHERE id = $1 RETURNING id',
      [attemptId]
    );

    if (result.rowCount === 0) {
      return { success: false, error: 'Attempt not found' };
    }

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return { success: false, error: 'Failed to delete attempt' };
  }
}
