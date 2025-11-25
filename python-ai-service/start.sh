#!/bin/bash

# Python AI Detection Service Startup Script
set -e

echo "🚀 Starting Python AI Detection Service..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if YOLO model needs to be downloaded
if [ ! -f "yolov8n.pt" ]; then
    echo "📥 Downloading YOLO model (this may take a few minutes)..."
    python3 -c "
import requests
import os
print('Downloading YOLOv8n ONNX model...')
url = 'https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.onnx'
response = requests.get(url, stream=True)
with open('yolov8n.onnx', 'wb') as f:
    for chunk in response.iter_content(chunk_size=8192):
        f.write(chunk)
print('ONNX model downloaded successfully!')
"
fi

# Start the service
echo "🌟 Starting AI Detection Service on http://0.0.0.0:8082"
echo "   API endpoint: POST http://localhost:8082/detect"
echo "   Health check: GET http://localhost:8082/health"
echo "   Press Ctrl+C to stop the service"
echo ""

# Run the service
python3 main.py
