from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    """
    Training endpoint - Not available in Vercel deployment.

    Due to Vercel's 250 MB serverless function size limit,
    training must be done locally and models uploaded to Blob Storage.

    To train:
    1. Run locally: cd ml-service && python train_model.py
    2. Upload models to Vercel Blob:
       - vercel blob upload models/parameters-predictor.onnx
       - vercel blob upload models/encoders.json
    """

    def do_POST(self):
        self.send_response(501)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': False,
            'error': 'Training not available in Vercel deployment',
            'message': 'Please train locally using: cd ml-service && python train_model.py',
            'instructions': [
                '1. Install dependencies: pip install -r ml-service/requirements-train.txt',
                '2. Set DATABASE_URL environment variable',
                '3. Run training: python ml-service/train_model.py',
                '4. Upload models to Vercel Blob Storage:',
                '   - vercel blob upload models/parameters-predictor.onnx',
                '   - vercel blob upload models/encoders.json'
            ]
        }).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
        self.end_headers()
