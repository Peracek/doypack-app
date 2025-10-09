# Doypack ML Service - Docker Edition

A complete standalone Docker service for doypack parameter prediction with integrated training capabilities.

## Features

- ✅ **FastAPI-based REST API** for predictions
- ✅ **Integrated model training** via API endpoint
- ✅ **Persistent model storage** in container volumes
- ✅ **No external dependencies** (no blob storage, no ONNX conversion)
- ✅ **Health checks** and monitoring
- ✅ **Auto-loading** of saved models on startup

## API Endpoints

### GET `/`
Health check and service status

### GET `/health`
Detailed health information

### POST `/predict`
Make predictions for doypack parameters

**Request:**
```json
{
  "material_type": "BOPP/BOPP MET/CPP (MAT-02514)",
  "print_coverage": 180,
  "package_size": 5,
  "sackovacka": "S2"
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
    "bottom_temperature_c": 160.0,
    "bottom_pressure_bar": 4.5,
    "bottom_dwell_time_s": 1.2,
    "side_e_setup": "iron-iron",
    "side_e_temperature_upper_c": 155.0,
    "side_e_temperature_lower_c": 155.0,
    "side_e_pressure_bar": 4.2,
    "side_e_dwell_time_s": 1.1,
    ...
  },
  "model_trained_at": "2025-10-09T10:30:00"
}
```

### POST `/train`
Train or retrain the model with current database data

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully",
  "metrics": {
    "mae": 0.25,
    "r2": 0.85
  },
  "training_samples": 10
}
```

### GET `/model/info`
Get information about the current model

## Quick Start

### 1. Setup Environment
```bash
cd docker-ml-service
cp .env.example .env
# Edit .env with your database URL
```

### 2. Build and Run
```bash
# Build the image
docker-compose build

# Start the service
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 3. Train the Model
```bash
# Train the model with current database data
curl -X POST http://localhost:8000/train
```

### 4. Make Predictions
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "material_type": "BOPP/BOPP MET/CPP (MAT-02514)",
    "print_coverage": 180,
    "package_size": 5,
    "sackovacka": "S2"
  }'
```

## Development

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable
export DATABASE_URL="your_database_url"

# Run locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Development
```bash
# Build and run
docker-compose up --build

# Rebuild after changes
docker-compose down
docker-compose up --build
```

## Model Persistence

- Models are saved to `/app/models/` inside the container
- Use Docker volumes to persist models between container restarts
- Models are automatically loaded on service startup

## Monitoring

- Health check endpoint: `GET /health`
- Service status: `GET /`
- Model information: `GET /model/info`

## Advantages over Vercel Approach

1. **No External Dependencies**: Everything is self-contained
2. **Reliable Storage**: Models are stored in container volumes
3. **Simple Deployment**: Single Docker container
4. **Easy Debugging**: Full access to logs and debugging
5. **Flexible Hosting**: Can run anywhere Docker is supported
6. **No Size Limits**: No 250MB Vercel function limitations
7. **Persistent State**: Models survive container restarts

## Production Deployment

### Docker Swarm
```bash
docker service create \
  --name doypack-ml \
  --publish 8000:8000 \
  --env DATABASE_URL="your_db_url" \
  --mount type=volume,source=doypack-models,target=/app/models \
  doypack-ml:latest
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: doypack-ml
spec:
  replicas: 1
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
        image: doypack-ml:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "your_database_url"
        volumeMounts:
        - name: models
          mountPath: /app/models
      volumes:
      - name: models
        persistentVolumeClaim:
          claimName: doypack-models
```

## Troubleshooting

### Model Not Loading
- Check if `/app/models/model.pkl` exists
- Verify database connection
- Check logs: `docker-compose logs`

### Training Fails
- Ensure sufficient data (minimum 5 successful attempts)
- Check database connectivity
- Verify no NULL values in required fields

### Predictions Fail
- Train model first: `POST /train`
- Check available materials: `GET /model/info`
- Verify input parameters match training data
