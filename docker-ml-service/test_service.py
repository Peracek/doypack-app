#!/usr/bin/env python3
"""
Test script for the Doypack ML Service
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_model_info():
    """Test model info endpoint"""
    print("\n🔍 Testing model info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/model/info")
        print(f"✅ Model info: {response.status_code}")
        data = response.json()
        print(f"   Model loaded: {data.get('model_loaded', False)}")
        if data.get('available_materials'):
            print(f"   Available materials: {data['available_materials']}")
        return True
    except Exception as e:
        print(f"❌ Model info failed: {e}")
        return False

def test_training():
    """Test training endpoint"""
    print("\n🔍 Testing training endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/train")
        print(f"✅ Training: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
            print(f"   Training samples: {data.get('training_samples', 0)}")
            if data.get('metrics'):
                print(f"   Metrics: {data['metrics']}")
        else:
            print(f"   Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Training failed: {e}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print("\n🔍 Testing prediction endpoint...")
    
    # Test data based on our remaining successful attempt
    test_data = {
        "material_type": "BOPP/BOPP MET/CPP (MAT-02514)",
        "print_coverage": 180,
        "package_size": 5,
        "sackovacka": "S2"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            headers={"Content-Type": "application/json"},
            json=test_data
        )
        print(f"✅ Prediction: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
            if data.get('predictions'):
                predictions = data['predictions']
                print(f"   Zipper temp: {predictions.get('zipper_temperature_c', 'N/A')}°C")
                print(f"   Bottom temp: {predictions.get('bottom_temperature_c', 'N/A')}°C")
                print(f"   Side E setup: {predictions.get('side_e_setup', 'N/A')}")
        else:
            print(f"   Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Doypack ML Service Tests")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("\n❌ Service is not running. Please start it first:")
        print("   uvicorn main:app --host 0.0.0.0 --port 8000")
        sys.exit(1)
    
    # Test model info
    test_model_info()
    
    # Test training
    training_success = test_training()
    
    if training_success:
        # Wait a moment for model to be loaded
        time.sleep(1)
        
        # Test model info again
        test_model_info()
        
        # Test prediction
        test_prediction()
    else:
        print("\n⚠️  Training failed, skipping prediction test")
    
    print("\n" + "=" * 50)
    print("🏁 Tests completed!")

if __name__ == "__main__":
    main()
