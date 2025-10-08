from http.server import BaseHTTPRequestHandler
import json
import pickle
import numpy as np
import os
import requests
from functools import lru_cache

# Vercel Blob Storage configuration
BLOB_STORE_ID = os.getenv('BLOB_READ_WRITE_TOKEN', '')
MODEL_BLOB_URL = f"https://blob.vercel-storage.com/ml-models/parameters-predictor.pkl?token={BLOB_STORE_ID}"

@lru_cache(maxsize=1)
def load_model():
    """
    Load model from Vercel Blob Storage.
    Cached to avoid reloading on warm function invocations.
    """
    print("Loading model from Vercel Blob...")

    # Download model from Blob
    response = requests.get(MODEL_BLOB_URL)

    if response.status_code != 200:
        raise Exception(f"Failed to download model: {response.status_code}")

    # Load pickle model
    model_data = pickle.loads(response.content)

    print(f"Model loaded successfully (version: {model_data.get('version', 'unknown')})")

    return model_data

def predict_parameters(material_type, print_coverage, package_size, sackovacka):
    """
    Predict all parameters for given order characteristics.

    Returns:
        dict: Predicted parameters for all phases
    """
    # Load model and encoders
    model_data = load_model()
    model = model_data['model']
    encoders = model_data['encoders']

    # Encode input features
    try:
        material_encoded = encoders['material'].transform([material_type])[0]
        sackovacka_encoded = encoders['sackovacka'].transform([sackovacka])[0]
    except ValueError as e:
        raise ValueError(f"Unknown material_type or sackovacka: {e}")

    # Prepare feature vector
    X = np.array([[material_encoded, print_coverage, package_size, sackovacka_encoded]])

    # Predict
    predictions = model.predict(X)[0]

    # Decode setup predictions (they were encoded as integers)
    setup_e_encoded = int(round(predictions[6]))
    setup_d_encoded = int(round(predictions[11]))
    setup_c_encoded = int(round(predictions[16]))
    setup_b_encoded = int(round(predictions[21]))
    setup_a_encoded = int(round(predictions[26]))

    # Map back to setup types
    setup_e = encoders['setup_e'].inverse_transform([setup_e_encoded])[0]
    setup_d = encoders['setup_d'].inverse_transform([setup_d_encoded])[0]
    setup_c = encoders['setup_c'].inverse_transform([setup_c_encoded])[0]
    setup_b = encoders['setup_b'].inverse_transform([setup_b_encoded])[0]
    setup_a = encoders['setup_a'].inverse_transform([setup_a_encoded])[0]

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

    return result

class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler"""

    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            # Extract parameters
            material_type = data.get('material_type')
            print_coverage = data.get('print_coverage')
            package_size = data.get('package_size')
            sackovacka = data.get('sackovacka')

            # Validate required fields
            if not all([material_type, print_coverage is not None, package_size, sackovacka]):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Missing required fields: material_type, print_coverage, package_size, sackovacka'
                }).encode())
                return

            # Make prediction
            predictions = predict_parameters(material_type, print_coverage, package_size, sackovacka)

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'predictions': predictions
            }).encode())

        except ValueError as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': f'Internal server error: {str(e)}'
            }).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
