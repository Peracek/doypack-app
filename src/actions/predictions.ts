'use server';

import type { PredictionInput, PredictionResult } from '@/types';

const PREDICTION_API_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/predict`
  : 'http://localhost:3000/api/predict';

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

export async function trainModel(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const TRAINING_API_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/train`
    : 'http://localhost:3000/api/train';

  try {
    const response = await fetch(TRAINING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
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
