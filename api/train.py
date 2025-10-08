from http.server import BaseHTTPRequestHandler
import json
import pickle
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

# Database and Blob configuration
DATABASE_URL = os.getenv('DATABASE_URL', '')
BLOB_STORE_TOKEN = os.getenv('BLOB_READ_WRITE_TOKEN', '')
TRAINING_API_KEY = os.getenv('TRAINING_API_KEY', '')  # Protect this endpoint

def fetch_training_data():
    """Fetch all successful attempts with their order data"""
    conn = psycopg2.connect(DATABASE_URL)
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

    # Output targets
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

    encoders = {
        'material': le_material,
        'sackovacka': le_sackovacka,
        'setup_e': le_setup_e,
        'setup_d': le_setup_d,
        'setup_c': le_setup_c,
        'setup_b': le_setup_b,
        'setup_a': le_setup_a
    }

    return X, y, encoders

def train_model(X, y):
    """Train Random Forest model and return metrics"""
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))

    metrics = {
        'mae': mae,
        'r2_score': r2,
        'train_samples': len(X_train),
        'test_samples': len(X_test)
    }

    return model, metrics

def upload_to_blob(model, encoders):
    """Upload trained model to Vercel Blob Storage"""
    model_data = {
        'model': model,
        'encoders': encoders,
        'version': '1.0.0'
    }

    # Serialize model
    model_bytes = pickle.dumps(model_data)

    # Upload to Vercel Blob
    upload_url = f"https://blob.vercel-storage.com/ml-models/parameters-predictor.pkl"

    headers = {
        'authorization': f'Bearer {BLOB_STORE_TOKEN}',
        'x-content-type': 'application/octet-stream'
    }

    response = requests.put(upload_url, data=model_bytes, headers=headers)

    if response.status_code not in [200, 201]:
        raise Exception(f"Failed to upload model: {response.status_code} - {response.text}")

    return len(model_bytes)

class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler for model training"""

    def do_POST(self):
        try:
            # Check API key for security
            api_key = self.headers.get('X-API-Key', '')
            if api_key != TRAINING_API_KEY:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Unauthorized: Invalid API key'
                }).encode())
                return

            # Fetch training data
            df = fetch_training_data()

            if len(df) < 10:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': f'Insufficient training data: {len(df)} samples (minimum 10 required)'
                }).encode())
                return

            # Prepare features
            X, y, encoders = prepare_features(df)

            # Train model
            model, metrics = train_model(X, y)

            # Upload to Blob Storage
            model_size = upload_to_blob(model, encoders)

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Model trained and uploaded successfully',
                'total_samples': len(df),
                'metrics': metrics,
                'model_size_mb': round(model_size / 1024 / 1024, 2)
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': f'Training failed: {str(e)}'
            }).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
        self.end_headers()
