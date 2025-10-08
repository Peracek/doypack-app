#!/usr/bin/env python3
"""
Training script for doypack parameter prediction model.
Run locally to train and test the model before deploying.

Exports model to ONNX format for lightweight deployment.

Usage:
    pip install -r requirements-train.txt
    python train_model.py
"""

import os
import pickle
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import psycopg2
from psycopg2.extras import RealDictCursor
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres.isdyfsusgykamjzxnmjt:S66mOjrLWyMN8I@aws-1-eu-central-1.pooler.supabase.com:6543/postgres')

def fetch_training_data():
    """Fetch all successful attempts with their order data"""
    print("Connecting to database...")
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

    print(f"Fetched {len(rows)} successful attempts")
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
    """Train Random Forest model"""
    print("\nTraining Random Forest model...")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")

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
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\nModel Performance:")
    print(f"  Mean Absolute Error: {mae:.2f}")
    print(f"  R² Score: {r2:.3f}")

    # Per-parameter MAE
    print(f"\nPer-parameter MAE:")
    for i, col in enumerate(y.columns):
        param_mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
        print(f"  {col}: {param_mae:.2f}")

    return model

def save_model(model, encoders):
    """Save model in ONNX format and encoders separately"""
    os.makedirs('models', exist_ok=True)

    # Convert model to ONNX
    initial_type = [('float_input', FloatTensorType([None, 4]))]  # 4 input features
    onnx_model = convert_sklearn(
        model,
        initial_types=initial_type,
        target_opset=12
    )

    # Save ONNX model
    with open('models/parameters-predictor.onnx', 'wb') as f:
        f.write(onnx_model.SerializeToString())

    # Save encoders separately (small JSON file)
    encoder_data = {
        'material': {
            'classes': encoders['material'].classes_.tolist()
        },
        'sackovacka': {
            'classes': encoders['sackovacka'].classes_.tolist()
        },
        'setup_e': {
            'classes': encoders['setup_e'].classes_.tolist()
        },
        'setup_d': {
            'classes': encoders['setup_d'].classes_.tolist()
        },
        'setup_c': {
            'classes': encoders['setup_c'].classes_.tolist()
        },
        'setup_b': {
            'classes': encoders['setup_b'].classes_.tolist()
        },
        'setup_a': {
            'classes': encoders['setup_a'].classes_.tolist()
        },
        'version': '1.0.0'
    }

    with open('models/encoders.json', 'w') as f:
        json.dump(encoder_data, f, indent=2)

    print("\nModel saved to models/parameters-predictor.onnx")
    print("Encoders saved to models/encoders.json")

    onnx_size = os.path.getsize('models/parameters-predictor.onnx') / 1024 / 1024
    encoder_size = os.path.getsize('models/encoders.json') / 1024

    print(f"ONNX model size: {onnx_size:.2f} MB")
    print(f"Encoders size: {encoder_size:.2f} KB")

def main():
    """Main training pipeline"""
    print("=== Doypack Parameter Prediction Model Training ===\n")

    # Fetch data
    df = fetch_training_data()

    if len(df) < 10:
        print("\n⚠️  WARNING: Less than 10 successful attempts found!")
        print("   Model may not perform well with limited data.")
        print("   Consider collecting more successful attempts before deploying.\n")

    # Prepare features
    X, y, encoders = prepare_features(df)

    # Train model
    model = train_model(X, y)

    # Save model
    save_model(model, encoders)

    print("\n✅ Training complete!")
    print("\nNext steps:")
    print("  1. Review model performance above")
    print("  2. Test predictions with sample data")
    print("  3. Deploy to Vercel by uploading model to Blob Storage")

if __name__ == '__main__':
    main()
