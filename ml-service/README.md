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

## Why ONNX? (The 250 MB Problem)

**The Problem:**
Vercel serverless functions have a strict **250 MB unzipped size limit** for the entire deployment package. When we initially tried deploying with scikit-learn for inference, the deployment failed:

```
Error: A Serverless Function has exceeded the unzipped maximum size of 250 MB
```

**Size breakdown (original approach):**
- scikit-learn: ~200 MB
- pandas: ~15 MB
- numpy: ~5 MB
- Total: ~220 MB (too close to limit, fails with dependencies)

**The Solution (ONNX):**
We split the system into two parts:
1. **Training** (local only): Uses full scikit-learn stack
2. **Inference** (Vercel): Uses lightweight ONNX Runtime

**Size breakdown (ONNX approach):**
- onnxruntime: ~50 MB
- numpy: ~5 MB
- requests: ~1 MB
- ONNX model file: ~2-10 MB
- Total: ~60 MB ✅ (fits comfortably)

**Additional benefits:**
- ✅ 4x smaller deployment size
- ✅ Faster inference (optimized runtime)
- ✅ Platform independent (works anywhere)
- ✅ Model versioning made easy

## Local Development

### 1. Install Training Dependencies

Due to Python 3.13+ PEP 668 protection, you need to use a virtual environment:

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-train.txt
```

**Note:** If you get an "externally-managed-environment" error, this is because modern Python versions prevent installing packages directly into the system Python to avoid conflicts. The virtual environment approach above solves this.

### 2. Set Database URL

```bash
export DATABASE_URL="your_supabase_connection_string"
```

### 3. Train Model Locally

Make sure your virtual environment is activated, then run:

```bash
# If not already activated:
source venv/bin/activate

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

### Setup Instructions

#### 1. Create Vercel Blob Storage

1. Go to https://vercel.com/dashboard
2. Select your project (doypack-next)
3. Click **Storage** tab
4. Click **Create Database** or **Connect Store**
5. Select **Blob** storage type
6. Name it: `ml-models`
7. Click **Create**

#### 2. Get Vercel Blob Token

1. After creating the store, click on `ml-models` in Storage tab
2. Go to **Settings** or **.env.local** tab
3. Copy the `BLOB_READ_WRITE_TOKEN` value (starts with `vercel_blob_`)

#### 3. Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**, and add:

1. **DATABASE_URL**
   - Get from: Supabase dashboard or your `.env.local`
   - Format: `postgresql://postgres:[password]@[host].supabase.co:5432/postgres`

2. **BLOB_READ_WRITE_TOKEN**
   - Get from: Vercel Blob Storage settings (step 2 above)
   - Format: `vercel_blob_...`

#### 4. Configure Vercel Environment Variables

Add the same `BLOB_READ_WRITE_TOKEN` to your Vercel project:
1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add `BLOB_READ_WRITE_TOKEN` with the token value
3. Make sure it's available for all environments (Production, Preview, Development)

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

## Retraining Options

**❌ `/api/train` endpoint does not exist**

Due to Vercel's 250 MB function size limit, we cannot deploy training on Vercel serverless functions. Instead, use:

1. **GitHub Actions** (Recommended) - See "Automated Retraining" section
   - Click a button in GitHub to retrain
   - Automatically uploads to Vercel Blob
   - Free (2,000 minutes/month)

2. **Local Training** - See "Local Development" section
   - Run `python ml-service/train_model.py`
   - Manually upload to Vercel Blob

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

### pip install errors

**"externally-managed-environment" error:**
- Use virtual environment as shown in step 1 above
- This is due to PEP 668 protection in Python 3.13+

**onnxruntime version conflicts:**
- If you get "Could not find a version that satisfies the requirement onnxruntime==1.19.2"
- Update requirements-train.txt to use a compatible version (e.g., onnxruntime>=1.20.0)
- Python 3.13 requires newer onnxruntime versions

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
