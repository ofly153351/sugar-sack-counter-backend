# AI Integration Documentation

This document describes the integration between the NestJS backend and the Rust AI detection service for person counting.

## Architecture Overview

The system consists of two main components:

1. **NestJS Backend** - Main API server handling business logic, authentication, and client requests
2. **Rust AI Service** - Microservice dedicated to AI inference using YOLO model for person detection

```
Client Request → NestJS API → Rust AI Service → YOLO Model → Person Count
```

## Component Details

### Rust AI Detection Service

**Location**: `ai-service/`

**Features**:
- REST API endpoint for person detection
- YOLO model inference using ONNX Runtime
- Multipart form data support for image uploads
- Async/await architecture with Tokio runtime
- Health check endpoint

**API Endpoint**:
```http
POST /detect
Content-Type: multipart/form-data

Body:
- image: [image file]

Response:
{
  "status": "ok",
  "person_count": 3
}
```

**Configuration**:
- Default port: 5000
- Model path: `models/yolov8n.onnx`
- Input size: 640x640 pixels

### NestJS AI Module

**Location**: `src/modules/ai-detector/`

**Components**:
- `AiDetectorModule` - Module registration
- `AiDetectorController` - HTTP controller for AI endpoints
- `AiDetectorService` - Service for communicating with Rust AI service

**API Endpoint**:
```http
POST /ai/detect
Content-Type: multipart/form-data

Body:
- image: [image file]

Response:
{
  "person_count": 3
}
```

## Setup Instructions

### Prerequisites

1. **Rust Installation**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **YOLO Model**:
   - Download YOLOv8n ONNX model
   - Place in `ai-service/models/yolov8n.onnx`
   - Without model, service uses mock detection for development

### Running the Services

1. **Start Rust AI Service**:
   ```bash
   cd ai-service
   ./start.sh
   ```

2. **Start NestJS Backend**:
   ```bash
   npm run start:dev
   ```

### Docker Deployment

Both services can be containerized:

```yaml
# docker-compose.yml
version: '3.8'
services:
  nestjs-backend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - ai-service
    environment:
      - AI_SERVICE_URL=http://ai-service:5000

  ai-service:
    build: ./ai-service
    ports:
      - "5000:5000"
    volumes:
      - ./ai-service/models:/app/models
```

## Testing

### Manual Testing with curl

1. **Test Rust Service Directly**:
   ```bash
   curl -X POST -F "image=@test-image.jpg" http://localhost:5000/detect
   ```

2. **Test NestJS Integration**:
   ```bash
   curl -X POST -F "image=@test-image.jpg" http://localhost:3000/ai/detect
   ```

### Automated Testing

Run the integration test script:
```bash
./test-ai-integration.sh
```

## Error Handling

### Common Issues

1. **Rust Service Not Running**:
   ```
   Error: AI service is unavailable. Please ensure the Rust AI service is running on port 5000.
   ```

2. **Model File Missing**:
   ```
   Warning: YOLO model file not found. Using mock detector for development.
   ```

3. **Invalid Image Format**:
   ```
   Error: Detection failed: Failed to read image data
   ```

### Troubleshooting

1. **Check Service Status**:
   ```bash
   curl http://localhost:5000/detect
   ```

2. **Verify Model File**:
   ```bash
   ls -la ai-service/models/
   ```

3. **Check Logs**:
   - Rust service logs to console
   - NestJS logs include AI service communication

## Performance Considerations

1. **Image Size**: Larger images increase processing time
2. **Model Selection**: YOLOv8n is optimized for speed vs accuracy
3. **Batch Processing**: Consider batching multiple detections
4. **Caching**: Cache results for identical images if applicable

## Security

1. **Input Validation**:
   - Validate image MIME types
   - Limit file sizes
   - Sanitize filenames

2. **Network Security**:
   - Use HTTPS in production
   - Consider service-to-service authentication
   - Rate limiting on API endpoints

## Monitoring

### Health Checks

- Rust Service: `GET http://localhost:5000/detect` (returns 405 Method Not Allowed for GET)
- NestJS Service: Built-in health check endpoints

### Metrics

Consider adding:
- Request latency monitoring
- Detection accuracy tracking
- Error rate monitoring
- Resource utilization (CPU/GPU)

## Future Enhancements

1. **Model Updates**:
   - Support for newer YOLO versions
   - Custom model training
   - Multiple model support

2. **Features**:
   - Batch processing
   - Video stream processing
   - Multiple object detection classes
   - Confidence threshold configuration

3. **Infrastructure**:
   - GPU acceleration
   - Horizontal scaling
   - Load balancing
   - Model versioning

## API Reference

### Rust AI Service

**Base URL**: `http://localhost:5000`

**Endpoints**:
- `POST /detect` - Detect persons in uploaded image

**Request**:
```http
POST /detect
Content-Type: multipart/form-data

Body:
- image: [binary image data]
```

**Response**:
```json
{
  "status": "ok",
  "person_count": 3
}
```

### NestJS AI Module

**Base URL**: `http://localhost:3000`

**Endpoints**:
- `POST /ai/detect` - Detect persons via NestJS (proxies to Rust service)

**Request**:
```http
POST /ai/detect
Content-Type: multipart/form-data

Body:
- image: [binary image data]
```

**Response**:
```json
{
  "person_count": 3
}
```

## Development Notes

- The Rust service uses a mock detector when no YOLO model is available
- Both services should be running for full functionality
- Consider environment-specific configurations for different deployments
- Monitor memory usage with large image processing workloads