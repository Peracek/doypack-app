import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE /api/attempts/[id] - Delete an attempt
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM attempts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete attempt' },
      { status: 500 }
    );
  }
}
