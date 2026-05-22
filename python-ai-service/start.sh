#!/bin/bash

# Python AI Detection Service Startup Script
set -e

echo "Starting Python AI Detection Service..."

# Check if uv is available, install if not
if ! command -v uv &> /dev/null; then
    echo "uv not found. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source "$HOME/.local/bin/env"
fi

# Create virtual environment with uv if not exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment with uv..."
    uv venv
fi

# Install dependencies
echo "Installing dependencies..."
uv pip install -r requirements.txt

# Check if YOLO model needs to be downloaded
if [ ! -f "yolov8n.pt" ]; then
    echo "Downloading YOLO model (this may take a few minutes)..."
    uv run python3 -c "
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
echo "Starting AI Detection Service on http://0.0.0.0:8082"
echo "   API endpoint: POST http://localhost:8082/detect"
echo "   Health check: GET http://localhost:8082/health"
echo "   Press Ctrl+C to stop the service"
echo ""

uv run python3 main.py
