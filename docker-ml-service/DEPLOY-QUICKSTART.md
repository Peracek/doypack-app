# 🚀 Quick Deploy to Google Cloud

## 1. Prerequisites (5 minutes)

```bash
# Install Google Cloud CLI
brew install google-cloud-sdk

# Login to Google Cloud
gcloud auth login

# Create or select project
gcloud projects create doypack-ml-project  # or use existing
gcloud config set project doypack-ml-project

# Enable required services
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

## 2. Deploy (2 commands)

```bash
cd docker-ml-service

# Edit deploy.sh - change PROJECT_ID to your actual project ID
nano deploy.sh  # Change "your-project-id" to your real project ID

# Set DATABASE_URL from your .env.local file
export DATABASE_URL="your_database_url_from_env_local"

# Deploy!
./deploy.sh
```

## 3. Update Next.js App

Copy the service URL from the deploy script output and update your `.env.local`:

```bash
ML_SERVICE_URL=https://doypack-ml-xxxxxxxxx-uc.a.run.app
DATABASE_URL=your_database_url_from_env_local
```

## 4. Test

```bash
# Test the deployed service
curl https://your-service-url.run.app/health

# Train the model (when you have ≥5 successful attempts)
curl -X POST https://your-service-url.run.app/train

# Make predictions
curl -X POST https://your-service-url.run.app/predict \
  -H "Content-Type: application/json" \
  -d '{
    "material_type": "BOPP/BOPP MET/CPP (MAT-02514)",
    "print_coverage": 180,
    "package_size": 5,
    "sackovacka": "S2"
  }'
```

## 💰 Cost Estimate

**Google Cloud Run** (Pay-per-use):
- **Free tier**: 2 million requests/month
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Estimated**: $5-20/month for moderate usage

## 🔧 Troubleshooting

**Build fails?**
```bash
# Check Docker is running
docker info

# Check project ID is correct
gcloud config get-value project
```

**Deploy fails?**
```bash
# Check authentication
gcloud auth list

# Check enabled services
gcloud services list --enabled
```

**Service not responding?**
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Check service status
gcloud run services describe doypack-ml --region us-central1
```

That's it! Your ML service will be running on Google Cloud in about 10 minutes. 🎉
