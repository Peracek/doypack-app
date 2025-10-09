# Deploy Doypack ML Service to Google Cloud

This guide shows how to deploy the Docker ML service to Google Cloud using different approaches.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** installed and authenticated
3. **Docker** installed locally
4. **Project ID** in Google Cloud Console

## Setup Google Cloud CLI

```bash
# Install Google Cloud CLI (if not installed)
# macOS:
brew install google-cloud-sdk

# Authenticate
gcloud auth login

# Set your project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Option 1: Google Cloud Run (Recommended - Serverless)

Cloud Run is perfect for ML services - serverless, auto-scaling, pay-per-use.

### Step 1: Build and Push to Container Registry

```bash
cd docker-ml-service

# Set your project ID
export PROJECT_ID=your-project-id

# Build and tag the image
docker build -t gcr.io/$PROJECT_ID/doypack-ml:latest .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/doypack-ml:latest
```

### Step 2: Deploy to Cloud Run

```bash
# Deploy with environment variables
gcloud run deploy doypack-ml \
  --image gcr.io/$PROJECT_ID/doypack-ml:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="$DATABASE_URL" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10
```

### Step 3: Get Service URL

```bash
# Get the deployed service URL
gcloud run services describe doypack-ml --region us-central1 --format 'value(status.url)'
```

## Option 2: Google Kubernetes Engine (GKE)

For more control and persistent storage.

### Step 1: Create GKE Cluster

```bash
# Create cluster
gcloud container clusters create doypack-cluster \
  --zone us-central1-a \
  --num-nodes 2 \
  --machine-type e2-medium \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 5

# Get credentials
gcloud container clusters get-credentials doypack-cluster --zone us-central1-a
```

### Step 2: Create Kubernetes Manifests

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: doypack-ml
  labels:
    app: doypack-ml
spec:
  replicas: 2
  selector:
    matchLabels:
      app: doypack-ml
  template:
    metadata:
      labels:
        app: doypack-ml
    spec:
      containers:
      - name: doypack-ml
        image: gcr.io/YOUR_PROJECT_ID/doypack-ml:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: DATABASE_URL
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: models-storage
          mountPath: /app/models
      volumes:
      - name: models-storage
        persistentVolumeClaim:
          claimName: models-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: doypack-ml-service
spec:
  selector:
    app: doypack-ml
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: models-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Step 3: Deploy to GKE

```bash
# Apply the deployment
kubectl apply -f k8s-deployment.yaml

# Get external IP
kubectl get service doypack-ml-service
```

## Option 3: One-Command Cloud Build Deploy

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/doypack-ml:$COMMIT_SHA', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/doypack-ml:$COMMIT_SHA']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - 'doypack-ml'
    - '--image'
    - 'gcr.io/$PROJECT_ID/doypack-ml:$COMMIT_SHA'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
    - '--set-env-vars'
    - 'DATABASE_URL=$DATABASE_URL'

images:
- gcr.io/$PROJECT_ID/doypack-ml:$COMMIT_SHA
```

Then deploy:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

## Recommended: Cloud Run Approach

**Why Cloud Run is ideal for ML services:**

✅ **Serverless**: No server management  
✅ **Auto-scaling**: Scales to zero when not used  
✅ **Pay-per-use**: Only pay for actual requests  
✅ **Fast deployment**: Deploy in minutes  
✅ **HTTPS included**: Automatic SSL certificates  
✅ **Global**: Available in multiple regions  

## Cost Estimation

**Cloud Run (Recommended)**:
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Requests**: $0.40 per million requests
- **Estimated monthly cost**: $5-20 for moderate usage

**GKE**:
- **Cluster**: ~$73/month for e2-medium nodes
- **Storage**: $0.10/GB/month for persistent disks
- **Estimated monthly cost**: $80-150/month

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

# Configuration
PROJECT_ID="your-project-id"
SERVICE_NAME="doypack-ml"
REGION="us-central1"

echo "🚀 Deploying Doypack ML Service to Google Cloud Run..."

# Build and push
echo "📦 Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

echo "⬆️ Pushing to Container Registry..."
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
  --timeout 900

echo "✅ Deployment complete!"
echo "🔗 Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
```

## Environment Variables for Production

Update your Next.js `.env.local`:

```bash
# For Cloud Run deployment
ML_SERVICE_URL=https://doypack-ml-xxxxxxxxx-uc.a.run.app

# For GKE deployment  
ML_SERVICE_URL=http://EXTERNAL_IP

# Database (keep your existing DATABASE_URL from .env.local)
DATABASE_URL=your_database_url_here
```

## Monitoring and Logs

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=doypack-ml" --limit 50

# View service status
gcloud run services describe doypack-ml --region us-central1

# Test deployed service
curl https://your-service-url.run.app/health
```

## Security Considerations

For production, consider:

1. **Authentication**: Add API keys or OAuth
2. **VPC**: Deploy in private network
3. **Secrets**: Use Google Secret Manager for DATABASE_URL
4. **Monitoring**: Set up Cloud Monitoring alerts
5. **Backup**: Regular model backups to Cloud Storage

Choose **Cloud Run** for simplicity and cost-effectiveness, or **GKE** if you need more control and persistent storage.
