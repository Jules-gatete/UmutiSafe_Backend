# UmutiSafe API Documentation

Complete API documentation for UmutiSafe Backend

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "phone": "+250 788 123 456",
  "location": "Kigali, Gasabo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      ...
    },
    "token": "jwt_token_here"
  }
}
```

### 1.2 Login
**POST** `/auth/login`

Login to get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

### 1.3 Get Current User
**GET** `/auth/me`

Get currently logged in user details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    ...
  }
}
```

### 1.4 Update Profile
**PUT** `/auth/profile`

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+250 788 999 999",
  "location": "Kigali, Kicukiro"
}
```

### 1.5 Change Password
**PUT** `/auth/change-password`

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## 2. Disposal Endpoints

### 2.1 Create Disposal
**POST** `/disposals`

Create a new medicine disposal record.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "genericName": "Paracetamol",
  "brandName": "Panadol",
  "dosageForm": "Tablet",
  "packagingType": "Blister Pack",
  "predictedCategory": "Analgesic",
  "riskLevel": "LOW",
  "confidence": 0.95,
  "disposalGuidance": "Mix with coffee grounds...",
  "reason": "expired"
}
```

### 2.2 Get My Disposals
**GET** `/disposals?status=pending_review&page=1&limit=10`

Get all disposals for current user.

**Query Parameters:**
- `status` (optional): Filter by status
- `riskLevel` (optional): Filter by risk level
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 5
  }
}
```

### 2.3 Get Single Disposal
**GET** `/disposals/:id`

Get details of a specific disposal.

### 2.4 Update Disposal
**PUT** `/disposals/:id`

Update disposal status or notes.

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Disposed safely"
}
```

### 2.5 Delete Disposal
**DELETE** `/disposals/:id`

Delete a disposal record.

### 2.6 Get Disposal Statistics
**GET** `/disposals/stats`

Get disposal statistics for current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDisposals": 15,
    "pendingReview": 3,
    "completed": 10,
    "byRiskLevel": {
      "LOW": 8,
      "MEDIUM": 5,
      "HIGH": 2
    }
  }
}
```

---

## 3. Pickup Request Endpoints

### 3.1 Create Pickup Request
**POST** `/pickups`

Create a new pickup request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "chwId": "chw_uuid",
  "medicineName": "Diazepam (Valium)",
  "disposalGuidance": "MUST be returned to CHW...",
  "reason": "no_longer_needed",
  "pickupLocation": "KG 123 St, Remera, Kigali",
  "latitude": -1.9536,
  "longitude": 30.0606,
  "preferredTime": "2024-10-15T10:00:00",
  "consentGiven": true,
  "notes": "Please call before arriving"
}
```

### 3.2 Get My Pickup Requests
**GET** `/pickups?status=pending&page=1&limit=10`

Get all pickup requests for current user.

### 3.3 Get CHW Pickup Requests
**GET** `/pickups/chw?status=pending`

Get pickup requests assigned to CHW (CHW role only).

### 3.4 Get Single Pickup Request
**GET** `/pickups/:id`

Get details of a specific pickup request.

### 3.5 Update Pickup Status (CHW)
**PUT** `/pickups/:id/status`

Update pickup request status (CHW only).

**Request Body:**
```json
{
  "status": "scheduled",
  "chwNotes": "Will arrive at 10 AM",
  "scheduledTime": "2024-10-15T10:00:00"
}
```

### 3.6 Cancel Pickup Request
**PUT** `/pickups/:id/cancel`

Cancel a pickup request.

### 3.7 Get CHW Statistics
**GET** `/pickups/chw/stats`

Get statistics for CHW (CHW role only).

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 5,
    "scheduled": 3,
    "completed": 45,
    "total": 53
  }
}
```

---

## 4. Medicine Endpoints

### 4.1 Get All Medicines
**GET** `/medicines?search=para&category=Analgesic&page=1&limit=50`

Get all medicines from FDA registry.

**Query Parameters:**
- `search` (optional): Search by name
- `category` (optional): Filter by category
- `riskLevel` (optional): Filter by risk level
- `page`, `limit`: Pagination

### 4.2 Search Medicines (Autocomplete)
**GET** `/medicines/search?q=para`

Search medicines for autocomplete (minimum 2 characters).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "genericName": "Paracetamol",
      "brandName": "Panadol",
      "dosageForm": "Tablet",
      "riskLevel": "LOW"
    }
  ]
}
```

### 4.3 Get Single Medicine
**GET** `/medicines/:id`

Get details of a specific medicine.

### 4.4 Predict from Text
**POST** `/medicines/predict/text`

Predict medicine classification from text input.

**Request Body:**
```json
{
  "generic_name": "Paracetamol",
  "brand_name": "Panadol",
  "dosage_form": "Tablet"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predicted_category": "Analgesic",
    "risk_level": "LOW",
    "confidence": 0.92,
    "disposal_guidance": "Mix with coffee grounds...",
    "safety_notes": "Low environmental impact...",
    "requires_chw": false,
    "medicine_info": {
      "generic_name": "Paracetamol",
      "brand_name": "Panadol",
      "dosage_form": "Tablet"
    }
  }
}
```

### 4.5 Predict from Image
**POST** `/medicines/predict/image`

Upload medicine image for OCR and classification.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image`: Image file (jpg, png)

**Response:**
```json
{
  "success": true,
  "data": {
    "ocr_text": {
      "medicine_name": "Paracetamol",
      "brand_name": "Panadol",
      "dosage": "500mg",
      "expiry_date": "2024-12-31"
    },
    "predicted_category": "Analgesic",
    "risk_level": "LOW",
    "confidence": 0.85,
    "disposal_guidance": "...",
    "requires_chw": false,
    "image_url": "/uploads/image-123456.jpg"
  }
}
```

### 4.6 Create Medicine (Admin)
**POST** `/medicines`

Create new medicine in registry (Admin only).

### 4.7 Update Medicine (Admin)
**PUT** `/medicines/:id`

Update medicine details (Admin only).

### 4.8 Delete Medicine (Admin)
**DELETE** `/medicines/:id`

Soft delete medicine (Admin only).

---

## 5. CHW Endpoints

### 5.1 Get All CHWs
**GET** `/chws?sector=Remera&availability=available&page=1`

Get all Community Health Workers.

### 5.2 Get Nearby CHWs
**GET** `/chws/nearby?sector=Remera&limit=5`

Get nearby available CHWs.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Marie Claire",
      "phone": "+250 788 234 567",
      "sector": "Remera",
      "availability": "available",
      "rating": 4.8,
      "completedPickups": 45,
      "coverageArea": "Gasabo District - Remera Sector"
    }
  ]
}
```

### 5.3 Get Single CHW
**GET** `/chws/:id`

Get details of a specific CHW.

### 5.4 Update Availability (CHW)
**PUT** `/chws/availability`

Update CHW availability status (CHW only).

**Request Body:**
```json
{
  "availability": "available"
}
```

Values: `available`, `busy`, `offline`

---

## 6. Education Tips Endpoints

### 6.1 Get All Tips
**GET** `/education?category=safety`

Get all education tips.

### 6.2 Get Single Tip
**GET** `/education/:id`

Get details of a specific tip.

### 6.3 Create Tip (Admin)
**POST** `/education`

Create new education tip (Admin only).

### 6.4 Update Tip (Admin)
**PUT** `/education/:id`

Update education tip (Admin only).

### 6.5 Delete Tip (Admin)
**DELETE** `/education/:id`

Soft delete education tip (Admin only).

---

## 7. Admin Endpoints

All admin endpoints require Admin role.

### 7.1 Get System Statistics
**GET** `/admin/stats`

Get comprehensive system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 2847,
    "total_chws": 156,
    "total_disposals": 8945,
    "pending_pickups": 234,
    "completed_this_month": 1289,
    "high_risk_collected": 487,
    "risk_distribution": {
      "LOW": 4523,
      "MEDIUM": 3234,
      "HIGH": 1188
    },
    "monthly_trend": [...],
    "top_medicines": [...]
  }
}
```

### 7.2 Get All Users
**GET** `/admin/users?role=chw&search=marie&page=1`

Get all users with filtering.

### 7.3 Update User
**PUT** `/admin/users/:id`

Update any user's details.

### 7.4 Delete User
**DELETE** `/admin/users/:id`

Soft delete a user.

### 7.5 Get All Disposals
**GET** `/admin/disposals?status=completed&riskLevel=HIGH`

Get all disposals system-wide.

### 7.6 Get All Pickup Requests
**GET** `/admin/pickups?status=pending`

Get all pickup requests system-wide.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding in production.

## CORS

CORS is configured to allow requests from the frontend origin specified in `.env` file.

