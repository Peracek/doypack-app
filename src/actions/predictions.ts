'use server';

import type { PredictionInput, PredictionResult } from '@/types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const PREDICTION_API_URL = `${ML_SERVICE_URL}/predict`;

export async function predictParameters(
  input: PredictionInput
): Promise<PredictionResult> {
  try {
    const response = await fetch(PREDICTION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP error ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Prediction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get predictions',
    };
  }
}

export async function trainModel(): Promise<{ success: boolean; message?: string; error?: string; metrics?: any; training_samples?: number }> {
  const TRAINING_API_URL = `${ML_SERVICE_URL}/train`;

  try {
    const response = await fetch(TRAINING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP error ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Training error:', error);
    return {
      success: false,
      error: error.message || 'Failed to train model',
    };
  }
}
