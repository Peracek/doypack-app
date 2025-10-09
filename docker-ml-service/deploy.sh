#!/bin/bash
set -e

# Configuration - UPDATE THESE VALUES
PROJECT_ID="doypack-474610"  # Your Google Cloud Project ID
SERVICE_NAME="doypack-ml"
REGION="us-central1"
DATABASE_URL="postgresql://postgres.isdyfsusgykamjzxnmjt:S66mOjrLWyMN8I@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"

echo "🚀 Deploying Doypack ML Service to Google Cloud Run..."
echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Service Name: $SERVICE_NAME"
echo "   Region: $REGION"
echo ""

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   brew install google-cloud-sdk"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Verify project ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Please update PROJECT_ID in this script with your actual Google Cloud Project ID"
    exit 1
fi

echo "📦 Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

echo "⬆️ Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo "🌐 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="$DATABASE_URL" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --port 8000

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Service URL:"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
echo "   $SERVICE_URL"
echo ""
echo "🧪 Test your deployment:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "📝 Update your Next.js .env.local file:"
echo "   ML_SERVICE_URL=$SERVICE_URL"
echo ""
echo "🎯 Available endpoints:"
echo "   GET  $SERVICE_URL/health"
echo "   GET  $SERVICE_URL/docs"
echo "   POST $SERVICE_URL/train"
echo "   POST $SERVICE_URL/predict"
