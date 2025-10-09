from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json
from typing import Dict, Any
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Doypack ML Service", version="1.0.0")

# Global variables for model and encoders
model = None
encoders = None
model_trained_at = None

class PredictionRequest(BaseModel):
    material_type: str
    print_coverage: float
    package_size: int
    sackovacka: str

class PredictionResponse(BaseModel):
    success: bool
    predictions: Dict[str, Any] = None
    error: str = None
    model_trained_at: str = None

class TrainingResponse(BaseModel):
    success: bool
    message: str
    metrics: Dict[str, float] = None
    training_samples: int = None

def get_db_connection():
    """Get database connection"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres.isdyfsusgykamjzxnmjt:S66mOjrLWyMN8I@aws-1-eu-central-1.pooler.supabase.com:6543/postgres')
    return psycopg2.connect(database_url)

def fetch_training_data():
    """Fetch all successful attempts with their order data"""
    logger.info("Fetching training data from database...")
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    query = """
    SELECT
        o.material_type,
        o.print_coverage,
        o.package_size,
        o.sackovacka,
        a.zipper_temperature_c,
        a.zipper_pressure_bar,
        a.zipper_dwell_time_s,
        a.bottom_temperature_c,
        a.bottom_pressure_bar,
        a.bottom_dwell_time_s,
        a.side_e_setup,
        a.side_e_temperature_upper_c,
        a.side_e_temperature_lower_c,
        a.side_e_pressure_bar,
        a.side_e_dwell_time_s,
        a.side_d_setup,
        a.side_d_temperature_upper_c,
        a.side_d_temperature_lower_c,
        a.side_d_pressure_bar,
        a.side_d_dwell_time_s,
        a.side_c_setup,
        a.side_c_temperature_upper_c,
        a.side_c_temperature_lower_c,
        a.side_c_pressure_bar,
        a.side_c_dwell_time_s,
        a.side_b_setup,
        a.side_b_temperature_upper_c,
        a.side_b_temperature_lower_c,
        a.side_b_pressure_bar,
        a.side_b_dwell_time_s,
        a.side_a_setup,
        a.side_a_temperature_upper_c,
        a.side_a_temperature_lower_c,
        a.side_a_pressure_bar,
        a.side_a_dwell_time_s
    FROM attempts a
    JOIN orders o ON a.order_id = o.id
    WHERE a.outcome = 'Úspěch'
    AND a.zipper_temperature_c IS NOT NULL
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    logger.info(f"Fetched {len(rows)} successful attempts")
    return pd.DataFrame(rows)

def prepare_features(df):
    """Prepare features and targets for training"""
    # Encode categorical features
    le_material = LabelEncoder()
    le_sackovacka = LabelEncoder()
    le_setup_e = LabelEncoder()
    le_setup_d = LabelEncoder()
    le_setup_c = LabelEncoder()
    le_setup_b = LabelEncoder()
    le_setup_a = LabelEncoder()

    df['material_encoded'] = le_material.fit_transform(df['material_type'])
    df['sackovacka_encoded'] = le_sackovacka.fit_transform(df['sackovacka'])
    df['setup_e_encoded'] = le_setup_e.fit_transform(df['side_e_setup'])
    df['setup_d_encoded'] = le_setup_d.fit_transform(df['side_d_setup'])
    df['setup_c_encoded'] = le_setup_c.fit_transform(df['side_c_setup'])
    df['setup_b_encoded'] = le_setup_b.fit_transform(df['side_b_setup'])
    df['setup_a_encoded'] = le_setup_a.fit_transform(df['side_a_setup'])

    # Input features
    X = df[['material_encoded', 'print_coverage', 'package_size', 'sackovacka_encoded']]

    # Output targets (all parameters we want to predict)
    y = df[[
        'zipper_temperature_c', 'zipper_pressure_bar', 'zipper_dwell_time_s',
        'bottom_temperature_c', 'bottom_pressure_bar', 'bottom_dwell_time_s',
        'setup_e_encoded', 'side_e_temperature_upper_c', 'side_e_temperature_lower_c',
        'side_e_pressure_bar', 'side_e_dwell_time_s',
        'setup_d_encoded', 'side_d_temperature_upper_c', 'side_d_temperature_lower_c',
        'side_d_pressure_bar', 'side_d_dwell_time_s',
        'setup_c_encoded', 'side_c_temperature_upper_c', 'side_c_temperature_lower_c',
        'side_c_pressure_bar', 'side_c_dwell_time_s',
        'setup_b_encoded', 'side_b_temperature_upper_c', 'side_b_temperature_lower_c',
        'side_b_pressure_bar', 'side_b_dwell_time_s',
        'setup_a_encoded', 'side_a_temperature_upper_c', 'side_a_temperature_lower_c',
        'side_a_pressure_bar', 'side_a_dwell_time_s'
    ]]

    # Store encoders for later use
    encoders_dict = {
        'material': le_material,
        'sackovacka': le_sackovacka,
        'setup_e': le_setup_e,
        'setup_d': le_setup_d,
        'setup_c': le_setup_c,
        'setup_b': le_setup_b,
        'setup_a': le_setup_a
    }

    return X, y, encoders_dict

def train_model_internal():
    """Train the Random Forest model"""
    global model, encoders, model_trained_at
    
    logger.info("Starting model training...")
    
    # Fetch data
    df = fetch_training_data()
    
    if len(df) < 5:
        raise ValueError(f"Insufficient training data: {len(df)} samples. Need at least 5.")
    
    # Prepare features
    X, y, encoders_dict = prepare_features(df)
    
    # Handle small datasets
    if len(X) < 10:
        # Use all data for training, no test split
        X_train, y_train = X, y
        test_size_used = 0
    else:
        # Normal train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        test_size_used = len(X_test)
    
    logger.info(f"Training samples: {len(X_train)}, Test samples: {test_size_used}")
    
    # Train model
    rf_model = RandomForestRegressor(
        n_estimators=min(100, len(X_train) * 10),
        max_depth=min(10, len(X_train)),
        min_samples_split=max(2, len(X_train) // 10),
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    
    # Evaluate if we have test data
    metrics = {}
    if test_size_used > 0:
        y_pred = rf_model.predict(X_test)
        metrics['mae'] = mean_absolute_error(y_test, y_pred)
        metrics['r2'] = r2_score(y_test, y_pred)
    
    # Update global variables
    model = rf_model
    encoders = encoders_dict
    model_trained_at = datetime.now().isoformat()
    
    # Save model to disk
    save_model_to_disk()
    
    logger.info("Model training completed successfully")
    
    return {
        'training_samples': len(X_train),
        'test_samples': test_size_used,
        'metrics': metrics
    }

def save_model_to_disk():
    """Save model and encoders to disk"""
    try:
        # Save model
        with open('/app/models/model.pkl', 'wb') as f:
            pickle.dump(model, f)
        
        # Save encoders
        encoders_serializable = {}
        for key, encoder in encoders.items():
            encoders_serializable[key] = {
                'classes': encoder.classes_.tolist()
            }
        
        with open('/app/models/encoders.json', 'w') as f:
            json.dump(encoders_serializable, f, indent=2)
        
        # Save metadata
        metadata = {
            'trained_at': model_trained_at,
            'version': '1.0.0'
        }
        
        with open('/app/models/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
            
        logger.info("Model saved to disk successfully")
        
    except Exception as e:
        logger.error(f"Failed to save model to disk: {e}")

def load_model_from_disk():
    """Load model and encoders from disk"""
    global model, encoders, model_trained_at
    
    try:
        # Load model
        with open('/app/models/model.pkl', 'rb') as f:
            model = pickle.load(f)
        
        # Load encoders
        with open('/app/models/encoders.json', 'r') as f:
            encoders_data = json.load(f)
        
        # Reconstruct LabelEncoders
        encoders = {}
        for key, data in encoders_data.items():
            le = LabelEncoder()
            le.classes_ = np.array(data['classes'])
            encoders[key] = le
        
        # Load metadata
        try:
            with open('/app/models/metadata.json', 'r') as f:
                metadata = json.load(f)
                model_trained_at = metadata.get('trained_at')
        except FileNotFoundError:
            model_trained_at = "Unknown"
        
        logger.info("Model loaded from disk successfully")
        return True
        
    except FileNotFoundError:
        logger.info("No saved model found on disk")
        return False
    except Exception as e:
        logger.error(f"Failed to load model from disk: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Load model on startup if available"""
    logger.info("Starting Doypack ML Service...")
    load_model_from_disk()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Doypack ML Service",
        "status": "running",
        "model_loaded": model is not None,
        "model_trained_at": model_trained_at
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_available": model is not None,
        "encoders_available": encoders is not None,
        "model_trained_at": model_trained_at
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make predictions for doypack parameters"""
    
    if model is None or encoders is None:
        raise HTTPException(
            status_code=503, 
            detail="Model not available. Please train the model first using /train endpoint."
        )
    
    try:
        # Encode input features
        material_encoded = encoders['material'].transform([request.material_type])[0]
        sackovacka_encoded = encoders['sackovacka'].transform([request.sackovacka])[0]
        
        # Prepare feature vector
        X = np.array([[material_encoded, request.print_coverage, request.package_size, sackovacka_encoded]])
        
        # Make prediction
        predictions = model.predict(X)[0]
        
        # Decode setup predictions
        setup_e_encoded = int(round(predictions[6]))
        setup_d_encoded = int(round(predictions[11]))
        setup_c_encoded = int(round(predictions[16]))
        setup_b_encoded = int(round(predictions[21]))
        setup_a_encoded = int(round(predictions[26]))
        
        # Map back to setup types
        setup_e = encoders['setup_e'].classes_[setup_e_encoded]
        setup_d = encoders['setup_d'].classes_[setup_d_encoded]
        setup_c = encoders['setup_c'].classes_[setup_c_encoded]
        setup_b = encoders['setup_b'].classes_[setup_b_encoded]
        setup_a = encoders['setup_a'].classes_[setup_a_encoded]
        
        # Build response
        result = {
            'zipper_temperature_c': round(float(predictions[0]), 1),
            'zipper_pressure_bar': round(float(predictions[1]), 1),
            'zipper_dwell_time_s': round(float(predictions[2]), 2),
            'bottom_temperature_c': round(float(predictions[3]), 1),
            'bottom_pressure_bar': round(float(predictions[4]), 1),
            'bottom_dwell_time_s': round(float(predictions[5]), 2),
            'side_e_setup': setup_e,
            'side_e_temperature_upper_c': round(float(predictions[7]), 1),
            'side_e_temperature_lower_c': round(float(predictions[8]), 1),
            'side_e_pressure_bar': round(float(predictions[9]), 1),
            'side_e_dwell_time_s': round(float(predictions[10]), 2),
            'side_d_setup': setup_d,
            'side_d_temperature_upper_c': round(float(predictions[12]), 1),
            'side_d_temperature_lower_c': round(float(predictions[13]), 1),
            'side_d_pressure_bar': round(float(predictions[14]), 1),
            'side_d_dwell_time_s': round(float(predictions[15]), 2),
            'side_c_setup': setup_c,
            'side_c_temperature_upper_c': round(float(predictions[17]), 1),
            'side_c_temperature_lower_c': round(float(predictions[18]), 1),
            'side_c_pressure_bar': round(float(predictions[19]), 1),
            'side_c_dwell_time_s': round(float(predictions[20]), 2),
            'side_b_setup': setup_b,
            'side_b_temperature_upper_c': round(float(predictions[22]), 1),
            'side_b_temperature_lower_c': round(float(predictions[23]), 1),
            'side_b_pressure_bar': round(float(predictions[24]), 1),
            'side_b_dwell_time_s': round(float(predictions[25]), 2),
            'side_a_setup': setup_a,
            'side_a_temperature_upper_c': round(float(predictions[27]), 1),
            'side_a_temperature_lower_c': round(float(predictions[28]), 1),
            'side_a_pressure_bar': round(float(predictions[29]), 1),
            'side_a_dwell_time_s': round(float(predictions[30]), 2),
        }
        
        return PredictionResponse(
            success=True,
            predictions=result,
            model_trained_at=model_trained_at
        )
        
    except ValueError as e:
        if "not in list" in str(e):
            raise HTTPException(
                status_code=400,
                detail=f"Unknown material_type or sackovacka value. Available values: {list(encoders['material'].classes_)} for material_type, {list(encoders['sackovacka'].classes_)} for sackovacka"
            )
        else:
            raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train", response_model=TrainingResponse)
async def train(background_tasks: BackgroundTasks):
    """Train or retrain the model"""
    
    try:
        result = train_model_internal()
        
        return TrainingResponse(
            success=True,
            message="Model trained successfully",
            metrics=result['metrics'],
            training_samples=result['training_samples']
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/model/info")
async def model_info():
    """Get information about the current model"""
    if model is None:
        return {
            "model_loaded": False,
            "message": "No model available"
        }
    
    available_materials = list(encoders['material'].classes_) if encoders else []
    available_sackovacka = list(encoders['sackovacka'].classes_) if encoders else []
    
    return {
        "model_loaded": True,
        "model_trained_at": model_trained_at,
        "available_materials": available_materials,
        "available_sackovacka": available_sackovacka,
        "model_type": "RandomForestRegressor",
        "n_estimators": model.n_estimators if model else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
