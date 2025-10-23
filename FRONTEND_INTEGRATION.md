# Frontend Integration Guide

This guide explains how to integrate the UmutiSafe frontend with the backend API.

## Overview

The backend provides RESTful API endpoints that replace all the mock data and functions in the frontend. Here's how to connect them:

## 1. Setup API Client in Frontend

Create an API client utility in your frontend:

**File: `UmutiSafe_App/src/utils/api.js`**

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

## 2. Replace Mock Functions

### Authentication (Login.jsx)

**Replace:**
```javascript
import { authState, setCurrentUser } from '../utils/mockData';
```

**With:**
```javascript
import api from '../utils/api';

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await api.post('/auth/login', {
      email: formData.email,
      password: formData.password
    });
    
    // Store token
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Navigate based on role
    const role = response.data.user.role;
    navigate(`/${role}`);
  } catch (error) {
    alert(error.message || 'Login failed');
  }
};
```

### Disposals (AddDisposal.jsx)

**Replace:**
```javascript
import { predictFromText, predictFromImage } from '../../utils/apiMocks';
import { addDisposal } from '../../utils/mockData';
```

**With:**
```javascript
import api from '../../utils/api';

// Predict from text
const handlePredictFromText = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const result = await api.post('/medicines/predict/text', {
      generic_name: formData.generic_name,
      brand_name: formData.brand_name,
      dosage_form: formData.dosage_form
    });
    
    setPrediction(result.data);
  } catch (error) {
    alert('Failed to predict. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Predict from image
const handlePredictFromImage = async () => {
  if (!imageFile) return;
  
  setLoading(true);
  const formData = new FormData();
  formData.append('image', imageFile);
  
  try {
    const result = await api.post('/medicines/predict/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    setPrediction(result.data);
  } catch (error) {
    alert('Failed to process image.');
  } finally {
    setLoading(false);
  }
};

// Save disposal
const handleSaveDisposal = async () => {
  try {
    await api.post('/disposals', {
      genericName: formData.generic_name,
      brandName: formData.brand_name,
      dosageForm: formData.dosage_form,
      packagingType: formData.packaging_type,
      predictedCategory: prediction.predicted_category,
      riskLevel: prediction.risk_level,
      confidence: prediction.confidence,
      disposalGuidance: prediction.disposal_guidance,
      reason: 'user_initiated'
    });
    
    alert('Disposal saved successfully!');
    navigate('/user/history');
  } catch (error) {
    alert('Failed to save disposal.');
  }
};
```

### Disposal History (DisposalHistory.jsx)

**Replace:**
```javascript
import { mockDisposals, currentUser } from '../../utils/mockData';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [disposals, setDisposals] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchDisposals = async () => {
    try {
      const response = await api.get('/disposals', {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined }
      });
      setDisposals(response.data);
    } catch (error) {
      console.error('Failed to fetch disposals:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchDisposals();
}, [filterStatus]);
```

### CHW Interaction (CHWInteraction.jsx)

**Replace:**
```javascript
import { mockCHWs, addPickupRequest } from '../../utils/mockData';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [chws, setChws] = useState([]);

useEffect(() => {
  const fetchCHWs = async () => {
    try {
      const response = await api.get('/chws/nearby');
      setChws(response.data);
    } catch (error) {
      console.error('Failed to fetch CHWs:', error);
    }
  };
  
  fetchCHWs();
}, []);

// Submit pickup request
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await api.post('/pickups', {
      chwId: selectedCHW.id,
      medicineName: formData.medicineName,
      disposalGuidance: formData.disposalGuidance,
      reason: formData.reason,
      pickupLocation: formData.pickupLocation,
      preferredTime: formData.preferredTime,
      consentGiven: formData.consent
    });
    
    setShowSuccess(true);
    // Reset form...
  } catch (error) {
    alert('Failed to submit pickup request.');
  }
};
```

### User Dashboard (Dashboard.jsx)

**Replace:**
```javascript
import { currentUser, mockDisposals, mockPickupRequests } from '../../utils/mockData';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [stats, setStats] = useState({
  totalDisposed: 0,
  pendingReview: 0,
  pickupsRequested: 0
});
const [recentDisposals, setRecentDisposals] = useState([]);

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const [statsRes, disposalsRes, pickupsRes] = await Promise.all([
        api.get('/disposals/stats'),
        api.get('/disposals', { params: { limit: 3 } }),
        api.get('/pickups')
      ]);
      
      setStats({
        totalDisposed: statsRes.data.totalDisposals,
        pendingReview: statsRes.data.pendingReview,
        pickupsRequested: pickupsRes.data.length
      });
      setRecentDisposals(disposalsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };
  
  fetchDashboardData();
}, []);
```

### CHW Dashboard (CHWDashboard.jsx)

**Replace:**
```javascript
import { mockPickupRequests, currentUser } from '../../utils/mockData';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [requests, setRequests] = useState([]);
const [stats, setStats] = useState({
  pending: 0,
  scheduled: 0,
  completed: 0
});

useEffect(() => {
  const fetchCHWData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        api.get('/pickups/chw'),
        api.get('/pickups/chw/stats')
      ]);
      
      setRequests(requestsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch CHW data:', error);
    }
  };
  
  fetchCHWData();
}, []);
```

### Pickup Requests (PickupRequests.jsx)

**Replace:**
```javascript
import { updatePickupRequestStatus } from '../../utils/mockData';
```

**With:**
```javascript
import api from '../../utils/api';

const handleSubmitReview = async () => {
  try {
    await api.put(`/pickups/${selectedRequest.id}/status`, {
      status: reviewStatus,
      chwNotes: reviewNotes
    });
    
    alert('Request status updated successfully!');
    setSelectedRequest(null);
    // Refresh data...
  } catch (error) {
    alert('Failed to update status.');
  }
};
```

### Admin Dashboard (AdminDashboard.jsx)

**Replace:**
```javascript
import { getSystemStats } from '../../utils/apiMocks';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [stats, setStats] = useState(null);

useEffect(() => {
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchStats();
}, []);
```

### Manage Users (ManageUsers.jsx)

**Replace:**
```javascript
import { mockUsers, mockCHWs } from '../../utils/mockData';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [users, setUsers] = useState([]);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { role: filterRole !== 'all' ? filterRole : undefined }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };
  
  fetchUsers();
}, [filterRole]);

const handleDelete = async (user) => {
  if (!confirm(`Delete ${user.name}?`)) return;
  
  try {
    await api.delete(`/admin/users/${user.id}`);
    alert('User deleted successfully');
    // Refresh users...
  } catch (error) {
    alert('Failed to delete user');
  }
};
```

### Medicines Registry (MedicinesRegistry.jsx)

**Replace:**
```javascript
import { mockMedicines } from '../../utils/mockData';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [medicines, setMedicines] = useState([]);

useEffect(() => {
  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines', {
        params: { search: searchQuery || undefined }
      });
      setMedicines(response.data);
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    }
  };
  
  fetchMedicines();
}, [searchQuery]);
```

### Education Tips (EducationTips.jsx)

**Replace:**
```javascript
import { mockEducationTips } from '../../utils/mockData';
```

**With:**
```javascript
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const [tips, setTips] = useState([]);

useEffect(() => {
  const fetchTips = async () => {
    try {
      const response = await api.get('/education');
      setTips(response.data);
    } catch (error) {
      console.error('Failed to fetch tips:', error);
    }
  };
  
  fetchTips();
}, []);
```

## 3. Environment Variables

Add to your frontend `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## 4. Protected Routes

Update `ProtectedRoute.jsx` to check authentication:

```javascript
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return children;
}
```

## 5. Testing the Integration

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd UmutiSafe_App && npm run dev`
3. Login with test credentials
4. Test all features

## 6. Common Issues

**CORS Error:**
- Make sure backend CORS_ORIGIN matches frontend URL
- Default: `http://localhost:5173`

**401 Unauthorized:**
- Token expired or invalid
- Re-login to get new token

**Network Error:**
- Backend not running
- Wrong API_BASE_URL

## Summary

Replace all mock imports with API calls using the `api` utility. The backend provides all the functionality that was previously mocked in the frontend.

