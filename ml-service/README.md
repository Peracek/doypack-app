# ML Parameter Prediction Service

This directory contains the machine learning training scripts for predicting doypack sealing parameters based on order characteristics.

## Overview

The ML model predicts all 32 sealing parameters (temperatures, pressures, dwell times, and setup types) based on:
- Material type
- Print coverage
- Package size
- Sackovacka (machine)

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend UI)  │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  /api/predict   │  ← Vercel Python Serverless Function
│   (Inference)   │  ← Downloads model from Vercel Blob
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel Blob    │
│ Storage (Model) │
└─────────────────┘
```

## Local Development

### 1. Install Dependencies

```bash
cd ml-service
pip install -r ../api/requirements.txt
```

### 2. Set Database URL

```bash
export DATABASE_URL="your_supabase_connection_string"
```

### 3. Train Model Locally

```bash
python train_model.py
```

This will:
- Fetch all successful attempts from database
- Train Random Forest model
- Save model to `models/parameters-predictor.pkl`
- Print training metrics

### 4. Upload Model to Vercel Blob

After training locally, upload the model to Vercel Blob Storage:

```bash
# Using Vercel CLI
vercel blob upload models/parameters-predictor.pkl --token YOUR_BLOB_TOKEN
```

Or manually upload via Vercel Dashboard.

## Deployment

### Environment Variables (Vercel)

Add these to your Vercel project:

```
DATABASE_URL=postgresql://...
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
TRAINING_API_KEY=secure_random_string_for_retraining
```

### API Endpoints

#### POST /api/predict
Predict parameters for a new order.

**Request:**
```json
{
  "material_type": "PAP/PET/LDPE (MAT-02448)",
  "print_coverage": 75,
  "package_size": 3,
  "sackovacka": "S1"
}
```

**Response:**
```json
{
  "success": true,
  "predictions": {
    "zipper_temperature_c": 155.0,
    "zipper_pressure_bar": 4.2,
    "zipper_dwell_time_s": 1.05,
    ...
  }
}
```

#### POST /api/train
Retrain model with latest data (requires API key).

**Headers:**
```
X-API-Key: your_training_api_key
```

**Response:**
```json
{
  "success": true,
  "message": "Model trained and uploaded successfully",
  "total_samples": 45,
  "metrics": {
    "mae": 2.34,
    "r2_score": 0.89,
    "train_samples": 36,
    "test_samples": 9
  },
  "model_size_mb": 1.23
}
```

## Model Details

**Algorithm:** Random Forest Regressor
- Multi-output regression (32 outputs)
- 100 trees
- Max depth: 10
- Handles categorical variables via label encoding

**Performance:**
- Cold start (first request): ~1-3 seconds
- Warm requests: ~50-200ms
- Model size: ~5-50MB (depends on training data)

**Minimum Training Data:** 10 successful attempts (recommended: 50+)

## Monitoring

Check model performance periodically:

1. Monitor prediction accuracy in production
2. Retrain when significant new data is available
3. Track R² score and MAE after retraining

## Troubleshooting

### Model not loading
- Check `BLOB_READ_WRITE_TOKEN` environment variable
- Verify model exists in Vercel Blob Storage
- Check Vercel function logs

### Poor predictions
- Need more training data (aim for 50+ successful attempts)
- Retrain model with `/api/train` endpoint
- Check if input data matches training distribution

### Cold starts too slow
- Increase Vercel function memory (reduces cold start time)
- Consider pre-warming functions with cron job
- Optimize model size (use ONNX instead of pickle)

## Future Improvements

- [ ] Add confidence intervals to predictions
- [ ] Implement model versioning
- [ ] Add feature importance analysis
- [ ] Create A/B testing for model versions
- [ ] Add automated retraining trigger
- [ ] Implement prediction caching
