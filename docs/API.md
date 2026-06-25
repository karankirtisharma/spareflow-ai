# Spareflow AI - API Specifications & Contracts

This document contains full details of the REST API endpoints, request structures, response schemas, and authentication requirements for Spareflow AI.

---

## 1. Global Specifications

- **Base URL**: `https://<your-host-domain>/api/v1`
- **Default Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt-access-token>`
- **Response Format**:
  All standard responses return a consistent envelope structure:
  ```json
  {
    "success": true,
    "message": "Resource fetched successfully",
    "data": { ... }
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### A. Register Business Tenant
Registers a new isolated tenant profile alongside an initial Owner account.
- **Endpoint**: `POST /api/auth/register`
- **Authentication Required**: None
- **Request Body**:
  ```json
  {
    "business_name": "Metro Auto Spares",
    "business_type": "Parts Distributor",
    "plan": "growth",
    "full_name": "Param Singh",
    "email": "param@metrospares.com",
    "phone": "+91 98765 00000",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Tenant registered successfully",
    "data": {
      "tenant": { "id": "t_9a12b...", "businessName": "Metro Auto Spares" },
      "user": { "id": "u_5c34d...", "fullName": "Param Singh", "email": "param@metrospares.com", "role": "Owner" }
    }
  }
  ```

### B. Login Session
Retrieves fresh JWT tokens for session authorization.
- **Endpoint**: `POST /api/auth/login`
- **Authentication Required**: None
- **Request Body**:
  ```json
  {
    "email": "param@metrospares.com",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "fullName": "Param Singh",
        "email": "param@metrospares.com",
        "role": "Owner"
      }
    }
  }
  ```

---

## 3. Branches Endpoints (`/api/branches`)

These endpoints are strictly sandboxed within the caller's tenant.

### A. Get All Branches
- **Endpoint**: `GET /api/branches`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "branchName": "Connaught Place Hub",
        "location": "New Delhi",
        "phone": "+91 11 2345 6789"
      }
    ]
  }
  ```

### B. Create Branch
- **Endpoint**: `POST /api/branches`
- **Access Level**: `Owner` or `Manager`
- **Request Body**:
  ```json
  {
    "branch_name": "Okhla Warehouse Block B",
    "location": "South Delhi",
    "phone": "+91 11 9876 5432"
  }
  ```

---

## 4. Products & Inventory Endpoints (`/api/v1/products`)

### A. Get All Products
- **Endpoint**: `GET /api/v1/products`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 4,
        "name": "Front Brake Pads - Ceramic",
        "sku": "SF-BRK-921",
        "unit": "pcs",
        "salesPrice": "2499.00",
        "purchasePrice": "1200.00",
        "qtyOnHand": "45"
      }
    ]
  }
  ```

### B. Create Product
- **Endpoint**: `POST /api/v1/products`
- **Access Level**: `Owner` or `Manager`
- **Request Body**:
  ```json
  {
    "name": "Rear Brake Rotors",
    "sku": "SF-BRK-104",
    "item_type": "single",
    "unit": "pcs",
    "purchase_price": 1400.00,
    "sales_price": 2800.00,
    "reorder_point": 10
  }
  ```

---

## 5. Security & Masking Endpoints

All Customer APIs (`/api/v1/spareflow/customers`) perform active encryption and decryption processes:
- Cleartext is automatically encrypted using high-performance AES-256-CBC at rest.
- Outbound records automatically decrypt contact details (email, phone, tax details/PAN) before returning them to authorized client devices.
