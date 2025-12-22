# Counting Logic Documentation

## Overview
This document explains the counting logic and data flow for the Sugar Sack Counter system. The system handles two types of counting sessions: **Sack Counting** (for sugar sacks) and **Box Counting** (for sugar boxes).

## Data Models

### 1. CountingSession (Main Session Record)
The central record that tracks each counting operation.

**Fields:**
- `id`: Unique identifier (UUID)
- `sessionType`: "sack" or "box"
- `userId`: User who performed the counting
- `vehicleId`: Vehicle being counted
- `sugarTypeId`: Type of sugar being counted
- `totalCount`: Total number of items counted
- `totalWeight`: Total weight (for sacks only)
- `countingDate`: Date/time of counting
- `status`: "completed", "pending", "cancelled"

**Relations:**
- `user`: User who performed the count
- `vehicle`: Vehicle being counted
- `sugarType`: Type of sugar
- `sackSession`: Reference to SackCountingSession (if sessionType = "sack")
- `boxSession`: Reference to BoxCountingSession (if sessionType = "box")

### 2. SackCountingSession (For Sugar Sacks)
Detailed record for sack counting operations.

**Fields:**
- `id`: Unique identifier
- `vehicleId`, `sugarTypeId`, `userId`: References
- `totalSacks`: Total number of sacks
- `totalWeight`: Total weight in kilograms
- `countingDate`: Date/time
- `status`: "completed", "in_progress", "cancelled"

**Relations:**
- `vehicle`: Vehicle being counted
- `sugarType`: Type of sugar
- `user`: User performing count
- `sackRows`: Individual rows of sacks in the vehicle
- `countingSession`: Link to main CountingSession

### 3. BoxCountingSession (For Sugar Boxes)
Detailed record for box counting operations.

**Fields:**
- `id`: Unique identifier
- `vehicleId`, `sugarTypeId`, `userId`: References
- `totalBoxes`: Total number of boxes
- `countingDate`: Date/time
- `status`: "completed", "in_progress", "cancelled"

**Relations:**
- `vehicle`: Vehicle being counted
- `sugarType`: Type of sugar
- `user`: User performing count
- `boxRows`: Individual rows of boxes in the vehicle
- `countingSession`: Link to main CountingSession

### 4. SackRow (Individual Sack Rows)
Records for each row of sacks in a vehicle.

**Fields:**
- `id`: Unique identifier
- `sessionId`: Reference to SackCountingSession
- `rowNumber`: Row position (1, 2, 3, ...)
- `weightType`: Weight category ("50kg", "100kg", etc.)
- `aiCount`: Count detected by AI (optional)
- `finalCount`: Verified/actual count
- `imagePath`: Path to image of this row

### 5. BoxRow (Individual Box Rows)
Records for each row of boxes in a vehicle.

**Fields:**
- `id`: Unique identifier
- `sessionId`: Reference to BoxCountingSession
- `rowNumber`: Row position (1, 2, 3, ...)
- `aiCount`: Count detected by AI (optional)
- `finalCount`: Verified/actual count
- `imagePath`: Path to image of this row

## Counting Workflow

### Phase 1: Session Creation
```
Frontend → POST /api/counting-sessions
{
  "sessionType": "sack",  // or "box"
  "userId": "user-uuid",
  "vehicleId": "vehicle-uuid",
  "sugarTypeId": "sugar-type-uuid",
  "countingDate": "2024-12-21T10:00:00.000Z"
}
```

### Phase 2: Row-by-Row Counting
For each row in the vehicle:

#### For Sacks:
```
Frontend → Create SackRow
{
  "sessionId": "sack-session-uuid",
  "rowNumber": 1,
  "weightType": "50kg",
  "aiCount": 15,          // From AI detection
  "finalCount": 15,       // After verification
  "imagePath": "/uploads/sack-row-1.jpg"
}
```

#### For Boxes:
```
Frontend → Create BoxRow
{
  "sessionId": "box-session-uuid",
  "rowNumber": 1,
  "aiCount": 20,          // From AI detection
  "finalCount": 20,       // After verification
  "imagePath": "/uploads/box-row-1.jpg"
}
```

### Phase 3: Session Completion
After all rows are counted:

1. **Calculate Totals:**
   - Sum `finalCount` from all rows
   - For sacks: Calculate total weight based on `weightType`

2. **Update Session:**
   ```
   Frontend → PATCH /api/counting-sessions/:id
   {
     "totalCount": 150,      // Sum of all rows
     "totalWeight": 7500,    // For sacks only
     "status": "completed"
   }
   ```

## API Endpoints

### Counting Sessions
- `POST /api/counting-sessions` - Create new counting session
- `GET /api/counting-sessions` - List all sessions
- `GET /api/counting-sessions/type/:sessionType` - Filter by type
- `GET /api/counting-sessions/user/:userId` - Filter by user
- `GET /api/counting-sessions/vehicle/:vehicleId` - Filter by vehicle
- `GET /api/counting-sessions/:id` - Get session details
- `PATCH /api/counting-sessions/:id` - Update session
- `DELETE /api/counting-sessions/:id` - Delete session

### Related Data
- `GET /api/vehicles` - Get available vehicles
- `GET /api/vehicles/active` - Get active vehicles only
- `GET /api/sugar-types` - Get sugar types
- `GET /api/users` - Get users (for assignment)

## Frontend Implementation Guide

### 1. Session Management
```javascript
// Create new counting session
const createSession = async (sessionData) => {
  const response = await fetch('/api/counting-sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  });
  return response.json();
};
```

### 2. Row Counting Interface
Design a row-by-row counting interface:
- Display vehicle layout with rows
- Show AI-detected count for each row
- Allow manual adjustment of counts
- Upload images for each row
- Track progress (rows completed/total)

### 3. Data Flow Example
```javascript
// Example flow for sack counting
const countSacks = async () => {
  // 1. Create session
  const session = await createSession({
    sessionType: 'sack',
    userId: currentUser.id,
    vehicleId: selectedVehicle.id,
    sugarTypeId: selectedSugarType.id
  });

  // 2. Count each row
  for (const row of vehicleRows) {
    const aiCount = await detectSacksWithAI(row.image);
    const sackRow = await createSackRow({
      sessionId: session.id,
      rowNumber: row.number,
      weightType: row.weightType,
      aiCount: aiCount,
      finalCount: aiCount, // Initially same as AI
      imagePath: row.imagePath
    });
    
    // Allow user to adjust count
    // Update sackRow if user makes changes
  }

  // 3. Complete session
  const totalCount = calculateTotal(sackRows);
  const totalWeight = calculateTotalWeight(sackRows);
  
  await updateSession(session.id, {
    totalCount,
    totalWeight,
    status: 'completed'
  });
};
```

### 4. Real-time Updates
Consider implementing:
- WebSocket for real-time collaboration
- Progress indicators
- Auto-save functionality
- Conflict resolution for concurrent edits

## Validation Rules

### Session Creation
- `sessionType` must be "sack" or "box"
- `userId`, `vehicleId`, `sugarTypeId` must be valid UUIDs
- `countingDate` must be valid ISO date string

### Row Creation
- `rowNumber` must be positive integer
- `finalCount` must be ≥ 0
- `aiCount` is optional but recommended
- For sacks: `weightType` is required

### Session Completion
- All rows must have `finalCount`
- `totalCount` must match sum of row counts
- For sacks: `totalWeight` must be calculated correctly

## Error Handling

### Common Errors
1. **404 Not Found** - Invalid IDs (vehicle, user, sugar type)
2. **400 Bad Request** - Invalid data format
3. **409 Conflict** - Duplicate session or row
4. **401 Unauthorized** - Missing or invalid token

### Recovery Strategies
- Save draft sessions locally
- Implement retry logic for failed requests
- Provide clear error messages to users
- Allow session resumption

## Performance Considerations

### For Large Vehicles
- Paginate row data for vehicles with many rows
- Implement lazy loading for images
- Use compression for image uploads
- Batch API calls where possible

### Data Synchronization
- Implement offline mode with local storage
- Sync data when connection is restored
- Handle merge conflicts gracefully
- Maintain audit trail of changes

## Testing Scenarios

### Happy Path
1. User creates session
2. AI detects counts for all rows
3. User verifies and confirms
4. Session completes successfully

### Edge Cases
1. **Partial Counting** - User counts only some rows
2. **AI Failure** - AI cannot detect count
3. **Manual Override** - User corrects AI count
4. **Session Interruption** - User leaves and returns later
5. **Multiple Vehicles** - Counting multiple vehicles simultaneously

## Integration Points

### 1. AI Service Integration
- Send images to AI service for counting
- Receive and parse AI response
- Handle AI service failures gracefully

### 2. Image Management
- Upload images to storage service
- Generate thumbnails for preview
- Manage image lifecycle (upload, view, delete)

### 3. Reporting
- Generate counting reports
- Export data to CSV/Excel
- Create dashboards with counting statistics

## Security Considerations

### Data Protection
- Authenticate all API calls
- Validate user permissions for each operation
- Encrypt sensitive data
- Implement rate limiting

### Audit Trail
- Log all counting operations
- Track who made changes and when
- Maintain version history for important data

## Deployment Checklist

### Frontend
- [ ] Session creation interface
- [ ] Row counting interface
- [ ] Image upload functionality
- [ ] Progress tracking
- [ ] Error handling
- [ ] Offline support
- [ ] Performance optimization

### Backend Integration
- [ ] API client implementation
- [ ] Authentication handling
- [ ] Data synchronization
- [ ] Error recovery
- [ ] Testing with real data

## Support & Troubleshooting

### Common Issues
1. **Images not uploading** - Check file size and format
2. **AI count inaccurate** - Provide manual override option
3. **Session not saving** - Check network connection
4. **Data mismatch** - Verify all IDs are valid

### Debugging Tips
- Enable detailed logging
- Use browser developer tools
- Test with sample data first
- Verify API responses match expectations

## Future Enhancements

### Planned Features
1. **Bulk Counting** - Count multiple vehicles at once
2. **Advanced Analytics** - Predictive counting based on patterns
3. **Mobile App** - Native mobile counting experience
4. **QR Code Integration** - Scan vehicle/sugar type QR codes
5. **Voice Commands** - Hands-free counting interface

### Technical Improvements
1. **Real-time Collaboration** - Multiple users counting simultaneously
2. **Machine Learning** - Improve AI accuracy over time
3. **Performance Optimization** - Faster image processing
4. **Accessibility** - Support for users with disabilities

---

*Last Updated: December 21, 2024*
*Version: 1.0*