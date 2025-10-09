from http.server import BaseHTTPRequestHandler
import json
import numpy as np
import os
import requests
from functools import lru_cache
import onnxruntime as ort

# Vercel Blob Storage configuration
BLOB_STORE_ID = os.getenv('BLOB_READ_WRITE_TOKEN', '')
MODEL_BLOB_URL = "https://ueq8wqiohiv8ffeu.public.blob.vercel-storage.com/parameters-predictor.onnx"
ENCODERS_BLOB_URL = "https://ueq8wqiohiv8ffeu.public.blob.vercel-storage.com/encoders.json"

@lru_cache(maxsize=1)
def load_model():
    """
    Load ONNX model and encoders from Vercel Blob Storage.
    Cached to avoid reloading on warm function invocations.
    """
    print("Starting load_model function")
    print(f"MODEL_BLOB_URL: {MODEL_BLOB_URL}")
    print(f"ENCODERS_BLOB_URL: {ENCODERS_BLOB_URL}")
    print(f"Loading model from Vercel Blob... Model URL: {MODEL_BLOB_URL}")

    # Prepare headers with blob token if available
    headers = {}
    if BLOB_STORE_ID:
        headers['Authorization'] = f'Bearer {BLOB_STORE_ID}'
        print(f"Using blob token for authentication: {BLOB_STORE_ID[:20]}...")
    else:
        print("No blob token found in environment variables")

    # Download ONNX model
    model_response = requests.get(MODEL_BLOB_URL, headers=headers)
    print(f"Model download response: {model_response.status_code}")
    if model_response.status_code != 200:
        raise Exception(f"Failed to download model: {model_response.status_code} from {MODEL_BLOB_URL}")

    # Download encoders
    print(f"Downloading encoders from: {ENCODERS_BLOB_URL}")
    encoders_response = requests.get(ENCODERS_BLOB_URL, headers=headers)
    print(f"Encoders download response: {encoders_response.status_code}")
    if encoders_response.status_code != 200:
        raise Exception(f"Failed to download encoders: {encoders_response.status_code} from {ENCODERS_BLOB_URL}")

    # Load ONNX session
    session = ort.InferenceSession(model_response.content)

    # Load encoders
    encoders = json.loads(encoders_response.content)

    print(f"Model loaded successfully (version: {encoders.get('version', 'unknown')})")

    return session, encoders

def predict_parameters(material_type, print_coverage, package_size, sackovacka):
    """
    Predict all parameters for given order characteristics.

    Returns:
        dict: Predicted parameters for all phases
    """
    # Load model and encoders
    session, encoders = load_model()

    # Encode input features manually using encoder JSON
    try:
        material_encoded = encoders['material']['classes'].index(material_type)
        sackovacka_encoded = encoders['sackovacka']['classes'].index(sackovacka)
    except ValueError as e:
        raise ValueError(f"Unknown material_type or sackovacka: {e}")

    # Prepare feature vector
    X = np.array([[material_encoded, print_coverage, package_size, sackovacka_encoded]], dtype=np.float32)

    # Predict using ONNX
    input_name = session.get_inputs()[0].name
    predictions = session.run(None, {input_name: X})[0][0]

    # Decode setup predictions (they were encoded as integers)
    setup_e_encoded = int(round(predictions[6]))
    setup_d_encoded = int(round(predictions[11]))
    setup_c_encoded = int(round(predictions[16]))
    setup_b_encoded = int(round(predictions[21]))
    setup_a_encoded = int(round(predictions[26]))

    # Map back to setup types using encoder classes
    setup_e = encoders['setup_e']['classes'][setup_e_encoded]
    setup_d = encoders['setup_d']['classes'][setup_d_encoded]
    setup_c = encoders['setup_c']['classes'][setup_c_encoded]
    setup_b = encoders['setup_b']['classes'][setup_b_encoded]
    setup_a = encoders['setup_a']['classes'][setup_a_encoded]

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
            print(f"About to call predict_parameters with: {material_type}, {print_coverage}, {package_size}, {sackovacka}")
            predictions = predict_parameters(material_type, print_coverage, package_size, sackovacka)
            print("Prediction completed successfully")

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
