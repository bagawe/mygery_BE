# MyGeri REST API - Postman Collection

Comprehensive Postman collection untuk testing MyGeri REST API dengan semua endpoints, security tests, dan validation scenarios.

## 📁 Files Included

- `MyGeri-REST-API.postman_collection.json` - Main collection dengan semua endpoints
- `MyGeri-Development.postman_environment.json` - Development environment
- `MyGeri-Production.postman_environment.json` - Production environment template

## 🚀 Quick Setup

### 1. Import Collection ke Postman

1. Buka Postman
2. Click **Import** button
3. Drag & drop file `MyGeri-REST-API.postman_collection.json`
4. Collection akan muncul di sidebar

### 2. Import Environment

1. Click **Import** lagi
2. Import file `MyGeri-Development.postman_environment.json`
3. Select environment "MyGeri REST API - Development" dari dropdown

### 3. Setup Base URL

Pastikan environment variable `base_url` sesuai dengan server Anda:
- Development: `http://localhost:3030`
- Production: `https://api.mygeri.com` (update sesuai domain Anda)

## 📋 Collection Structure

### 🏥 Health Check
- **GET** `/health` - Check API status

### 🔐 Authentication
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login (auto-saves tokens)
- **POST** `/api/auth/refresh-token` - Refresh access token
- **POST** `/api/auth/logout` - Logout & blacklist token
- **POST** `/api/auth/revoke-all-sessions` - Revoke all user sessions

### 👤 User Management
- **GET** `/api/users/profile` - Get current user profile
- **PUT** `/api/users/profile` - Update user profile
- **GET** `/api/users` - List users (admin, with pagination)
- **GET** `/api/users/:id` - Get user by ID
- **PUT** `/api/users/:id` - Update user (admin)
- **DELETE** `/api/users/:id` - Delete user (admin)

### 🧪 Test Cases
- **Invalid Registration** - Email validation, password strength
- **Authentication Errors** - Invalid credentials, unauthorized access
- **Rate Limiting Tests** - Test rate limiting on auth endpoints
- **Security Tests** - XSS protection, CSRF validation

## 🔄 Automatic Token Management

Collection sudah dikonfigurasi untuk automatic token management:

1. **Login** request akan automatically save `access_token` dan `refresh_token`
2. **Refresh Token** request akan update `access_token`
3. Semua authenticated requests menggunakan `{{access_token}}` variable

## 🎯 Testing Workflow

### Basic Authentication Flow
1. Run **Register User** (atau skip jika user sudah ada)
2. Run **Login User** - tokens akan tersimpan otomatis
3. Run protected endpoints seperti **Get User Profile**
4. Test **Refresh Token** untuk mendapatkan access token baru
5. Test **Logout** untuk revoke token

### Security Testing
1. Run **Rate Limit - Auth Endpoint** beberapa kali untuk test rate limiting
2. Run **XSS Test** untuk test input sanitization
3. Run **CSRF Test** untuk test CSRF protection
4. Run **Access Protected Route Without Token** untuk test auth middleware

### Error Handling Testing
1. Run **Invalid Email** registration test
2. Run **Weak Password** registration test
3. Run **Invalid Credentials** login test
4. Run **Invalid Refresh Token** test

## 🔧 Environment Variables

### Development Environment
```json
{
  "base_url": "http://localhost:3030",
  "access_token": "", // Auto-populated
  "refresh_token": "", // Auto-populated
  "user_id": "", // Auto-populated
  "test_email": "test@example.com",
  "test_username": "testuser",
  "test_password": "TestPassword123"
}
```

### Production Environment
Update values sesuai dengan production setup:
- `base_url`: Your production API URL
- `test_email`: Valid test email untuk production
- `test_password`: Secure test password

## 📊 Pre-request & Test Scripts

### Pre-request Scripts
- Automatically add security headers
- Set User-Agent untuk request tracking

### Test Scripts
- Validate response structure (`success` field)
- Check response time (< 5 seconds)
- Validate security headers presence
- Auto-save tokens dari login responses

## 🛡️ Security Headers Validation

Collection automatically validates security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Cache-Control: no-store, no-cache`

## 🔍 Rate Limiting Testing

### Auth Endpoints (5 requests/15 minutes)
1. Run **Rate Limit - Auth Endpoint** request
2. Send request 6 kali dengan cepat
3. Request ke-6 akan mendapat HTTP 429 error

### General Endpoints (100 requests/15 minutes)
1. Run any general API endpoint
2. Send request 101 kali dengan cepat untuk test limit

## 🚨 Error Response Examples

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later.",
  "retryAfter": "15 minutes"
}
```

### Unauthorized Error (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

## 📝 Custom Test Cases

Anda bisa menambah test cases sendiri dengan mengikuti pattern:

```javascript
// Pre-request Script
pm.collectionVariables.set("custom_variable", "value");

// Test Script
pm.test("Custom validation", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});
```

## 🔄 Continuous Testing

### Newman (CLI Testing)
Install Newman untuk automated testing:
```bash
npm install -g newman

# Run collection
newman run MyGeri-REST-API.postman_collection.json \
  -e  MyGeri-Development.postman_environment.json
```

### CI/CD Integration
Add Newman commands ke CI/CD pipeline untuk automated API testing.

## 📋 Checklist Testing

### Authentication Testing
- [ ] User registration dengan valid data
- [ ] User registration dengan invalid email
- [ ] User registration dengan weak password
- [ ] User login dengan valid credentials
- [ ] User login dengan invalid credentials
- [ ] Token refresh dengan valid refresh token
- [ ] Token refresh dengan invalid refresh token
- [ ] User logout
- [ ] Revoke all sessions

### Authorization Testing
- [ ] Access protected route dengan valid token
- [ ] Access protected route tanpa token
- [ ] Access protected route dengan expired token
- [ ] Admin-only endpoints dengan user token
- [ ] Admin-only endpoints dengan admin token

### Security Testing
- [ ] Rate limiting pada auth endpoints
- [ ] Rate limiting pada general endpoints
- [ ] XSS protection melalui input sanitization
- [ ] CSRF protection dengan missing headers
- [ ] Security headers presence
- [ ] Input validation untuk semua fields

### User Management Testing
- [ ] Get user profile
- [ ] Update user profile
- [ ] List users dengan pagination
- [ ] Get user by ID
- [ ] Update user (admin)
- [ ] Delete user (admin)

## 🎉 Ready to Test!

Collection ini sudah ready untuk comprehensive testing dari MyGeri REST API. Semua endpoints, security features, dan error scenarios sudah tercovered.

**Happy Testing! 🚀**