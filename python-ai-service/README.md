# Python AI Detection Service

A FastAPI-based microservice for person detection using YOLOv8 model with OpenCV.

## Features

- 🔍 Real-time person detection using YOLOv8
- 🖼️ Returns annotated images with bounding boxes
- 📊 Confidence scores for each detection
- 🚀 Fast inference with GPU support (if available)
- 🔄 Automatic model download
- ✅ Health check endpoint

## API Endpoints

### POST /detect
Detect persons in an uploaded image.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` field containing image file

**Response:**
```json
{
  "status": "success",
  "person_count": 3,
  "annotated_image": "base64_encoded_image_string",
  "detections": [
    {
      "class": "person",
      "confidence": 0.89,
      "bbox": [100.5, 150.2, 200.3, 300.1]
    }
  ]
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the service directory:**
   ```bash
   cd python-ai-service
   ```

2. **Run the startup script:**
   ```bash
   ./start.sh
   ```

   The script will:
   - Create a virtual environment
   - Install all dependencies
   - Download YOLOv8n model (if not exists)
   - Start the service on port 8082

### Manual Setup

If you prefer manual setup:

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the service:**
   ```bash
   python3 main.py
   ```

## Model Information

- **Model**: YOLOv8n (nano version)
- **Classes**: COCO dataset (80 classes including 'person')
- **Detection Threshold**: 0.5 confidence
- **Auto-download**: Yes, on first run

## Performance

- **CPU**: ~20-50ms per inference
- **GPU**: ~5-10ms per inference (if CUDA available)
- **Memory**: ~150MB RAM usage

## Integration with NestJS

The NestJS backend is configured to communicate with this service on port 8082.

**NestJS Endpoint:** `POST /api/ai/detect`

## Development

### Testing with curl
```bash
curl -X POST -F "file=@test_image.jpg" http://localhost:8082/detect
```

### Testing with Postman
1. Method: POST
2. URL: http://localhost:8082/detect
3. Body: form-data
   - Key: `file`
   - Type: File
   - Value: Select image file

### Health Check
```bash
curl http://localhost:8082/health
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill process using port 8082
   kill -9 $(lsof -ti:8082)
   ```

2. **Model download failed:**
   - Check internet connection
   - Manually download from: https://github.com/ultralytics/assets/releases/download/v8.0.0/yolov8n.pt

3. **Dependencies installation failed:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt --no-cache-dir
   ```

### Logs
- Service logs are displayed in the console
- Model loading status is shown on startup
- Detection results include confidence scores

## Deployment

### Production Considerations
- Use GPU for better performance
- Implement rate limiting
- Add authentication if needed
- Use process manager (e.g., PM2, supervisord)

### Docker (Optional)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8082

CMD ["python", "main.py"]
```

## License

MIT License - see LICENSE file for details.