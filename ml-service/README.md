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
│  /api/predict   │  ← Vercel Python Serverless (ONNX Runtime)
│   (Inference)   │  ← Downloads ONNX model + encoders from Blob
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel Blob    │
│ parameters-     │
│ predictor.onnx  │
│ encoders.json   │
└─────────────────┘
```

## Why ONNX?

Vercel serverless functions have a 250 MB size limit. Using ONNX:
- ✅ ONNX Runtime: ~50 MB (vs scikit-learn: ~200 MB)
- ✅ Faster inference
- ✅ Fits within Vercel limits
- ✅ Portable across platforms

## Local Development

### 1. Install Training Dependencies

```bash
cd ml-service
pip install -r requirements-train.txt
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
- Convert to ONNX format
- Save to `models/parameters-predictor.onnx` and `models/encoders.json`
- Print training metrics

### 4. Upload Models to Vercel Blob

After training locally, upload both files to Vercel Blob Storage:

```bash
# Using Vercel CLI
vercel blob upload models/parameters-predictor.onnx --store-name=ml-models
vercel blob upload models/encoders.json --store-name=ml-models
```

Or manually upload via Vercel Dashboard at: https://vercel.com/storage/blob

## Automated Retraining (GitHub Actions)

The repository includes a GitHub Actions workflow for automatic model retraining.

### Setup GitHub Secrets

Go to your GitHub repository settings → Secrets and variables → Actions, and add:

1. **DATABASE_URL** - Your Supabase PostgreSQL connection string
2. **BLOB_READ_WRITE_TOKEN** - Your Vercel Blob Storage token (from Vercel dashboard)

### Trigger Retraining

**Option 1: Manual Trigger**
1. Go to GitHub repository → Actions tab
2. Select "Retrain ML Model" workflow
3. Click "Run workflow" button
4. Wait 2-5 minutes for completion

**Option 2: Automatic Schedule**
- Runs automatically every Sunday at 2 AM UTC (can be modified in `.github/workflows/retrain-model.yml`)

### What the Workflow Does

1. Installs Python dependencies
2. Fetches successful attempts from database
3. Trains Random Forest model
4. Converts to ONNX format
5. Uploads `parameters-predictor.onnx` and `encoders.json` to Vercel Blob
6. Saves artifacts in GitHub for 30 days

The `/api/predict` endpoint will automatically use the updated model on next invocation (cold start downloads latest from Blob).

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
**Not available in Vercel deployment** (returns 501 error with instructions).

Training must be done locally due to package size constraints.
See "Local Development" section above.

## Model Details

**Algorithm:** Random Forest Regressor (converted to ONNX)
- Multi-output regression (32 outputs)
- 100 trees
- Max depth: 10
- Handles categorical variables via label encoding
- Exported to ONNX format for efficient inference

**Files:**
- `parameters-predictor.onnx` - ONNX model file (~2-10 MB)
- `encoders.json` - Label encoder mappings (~1-5 KB)

**Performance:**
- Cold start (first request): ~500ms-2s
- Warm requests: ~50-150ms
- Total deployment size: ~60 MB (ONNX Runtime + model)

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
- Model is already optimized with ONNX

### Deployment size exceeded
- Ensure you're using ONNX format (not pickle)
- Check api/requirements.txt only includes: onnxruntime, numpy, requests
- Don't include scikit-learn or pandas in deployment requirements

## Future Improvements

- [ ] Add confidence intervals to predictions
- [ ] Implement model versioning
- [ ] Add feature importance analysis
- [ ] Create A/B testing for model versions
- [ ] Add automated retraining trigger
- [ ] Implement prediction caching
