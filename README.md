# mygeri REST API

Backend REST API untuk platform mygeri menggunakan Express.js, Prisma ORM, dan PostgreSQL dengan implementasi keamanan terkini dan audit logging.

## 🚀 Fitur

### Core Features
- ✅ RESTful API dengan Express.js (ES Modules)
- ✅ PostgreSQL database dengan Prisma ORM
- ✅ JWT Authentication dengan Access & Refresh Tokens
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive input validation dengan Zod
- ✅ Unit & Integration testing dengan Jest

### 🔒 Security Features

#### Authentication & Authorization
- **Dual Token System**: Access token (15 menit) + Refresh token (7 hari)
- **Refresh Token Storage**: Disimpan di database dengan blacklist functionality
- **Password Security**: Bcrypt dengan salt rounds 12
- **Session Management**: Revoke all sessions, logout dengan blacklist
- **Token Cleanup**: Automatic cleanup expired/revoked tokens

#### Security Middleware
- **Rate Limiting**: 5 request/15 menit untuk auth endpoints, 100 request/15 menit untuk general
- **Input Sanitization**: XSS protection, SQL injection prevention
- **Security Headers**: Helmet.js dengan CSP, HSTS, dan security headers lainnya
- **CORS Configuration**: Configurable allowed origins
- **Request Size Limits**: JSON dan URL-encoded body size limits

#### Validation & Sanitization
- **Zod Validation**: Comprehensive schema validation untuk semua endpoints
- **File Upload Validation**: Type checking, size limits untuk images dan documents
- **Query Parameter Sanitization**: Type conversion dan validation
- **Password Policy**: Minimum 8 karakter, uppercase, lowercase, dan angka

### 📊 Audit & Logging

#### Activity Logging
- **User Actions**: Login, logout, register, password changes
- **Security Events**: Failed login attempts, unauthorized access, suspicious activities
- **API Access**: Automatic logging semua API calls dengan metadata
- **Client Information**: IP address, user agent tracking

#### Log Data Structure
- User ID, action type, success/failure status
- Detailed information dalam JSON format
- IP address dan user agent
- Timestamp dengan timezone
- Indexed untuk query performance

## 🏗️ Struktur Project

```
src/
├── app.js                 # Express app configuration
├── server.js              # Server startup with graceful shutdown
├── config/
│   ├── database.js        # Database configuration
│   └── jwt.js            # JWT configuration & utilities
├── middlewares/
│   ├── authMiddleware.js      # JWT authentication
│   ├── auditMiddleware.js     # Audit logging middleware
│   ├── securityMiddleware.js  # Security & rate limiting
│   ├── validationMiddleware.js # Zod validation middleware
│   ├── errorHandler.js        # Global error handler
│   └── requestLogger.js       # Request logging
├── modules/
│   ├── auth/
│   │   ├── auth.controller.js # Authentication endpoints
│   │   ├── auth.service.js    # Authentication business logic
│   │   └── auth.routes.js     # Authentication routes
│   └── user/
│       ├── user.controller.js # User management endpoints
│       ├── user.service.js    # User business logic
│       └── user.routes.js     # User routes
├── jobs/
│   └── tokenCleanup.js        # Scheduled token cleanup
└── utils/
    ├── logger.js              # Winston logger configuration
    └── password.js            # Password hashing utilities

tests/
├── setup.js                   # Test configuration
├── unit/                      # Unit tests
│   ├── auth.service.test.js
│   ├── auth.middleware.test.js
│   └── password.test.js
└── integration/               # Integration tests
    └── auth.api.test.js

prisma/
├── schema.prisma              # Database schema
├── migrations/                # Database migrations
└── seed.js                   # Database seeding
```

## 🛡️ Security Improvements Implemented

### 1. Refresh Token Management
- **Database Storage**: Refresh tokens disimpan di table `RefreshToken`
- **Blacklist System**: Token revocation dengan `isRevoked` flag
- **Expiry Management**: Automatic cleanup expired tokens
- **Session Control**: Revoke all sessions functionality

### 2. Enhanced Security Middleware
- **Rate Limiting**: Different limits untuk auth vs general endpoints
- **Input Sanitization**: XSS dan injection protection
- **Security Headers**: Comprehensive HTTP security headers
- **CSRF Protection**: State-changing operations protection

### 3. Audit Logging
- **Enhanced LogActivity**: Detailed logging dengan JSON metadata
- **Security Events**: Failed authentications, unauthorized access
- **Activity Tracking**: User actions dengan client information
- **Performance Indexes**: Optimized untuk query performance

### 4. Comprehensive Testing
- **Unit Tests**: Service layer, middleware, utilities
- **Integration Tests**: End-to-end API testing
- **Mock System**: Prisma mocking untuk isolated testing
- **Coverage Reports**: Test coverage tracking

### 5. Input Validation
- **Zod Schemas**: Type-safe validation untuk semua endpoints
- **File Upload**: Secure file handling dengan type/size validation
- **Query Sanitization**: Safe query parameter processing
- **Password Policy**: Strong password requirements

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm atau yarn

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd mygeri_restapi
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env dengan konfigurasi database dan secrets
```

4. **Setup database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run seed
```

5. **Run application**
```bash
# Development
npm run dev

# Production
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 API Endpoints

### Authentication

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | User registration | 5/15min |
| POST | `/api/auth/login` | User login | 5/15min |
| POST | `/api/auth/refresh-token` | Refresh access token | 5/15min |
| POST | `/api/auth/logout` | Logout user | 5/15min |
| POST | `/api/auth/revoke-all-sessions` | Revoke all user sessions | 5/15min |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | ✅ |
| PUT | `/api/users/profile` | Update user profile | ✅ |
| GET | `/api/users` | List users (admin) | ✅ |

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mygeri_dev"

# JWT Configuration
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Security
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX=100
```

### Security Considerations

1. **Secrets Management**: Gunakan strong random keys untuk JWT secrets
2. **HTTPS**: Selalu gunakan HTTPS di production
3. **Database Security**: Secure database credentials dan network access
4. **Rate Limiting**: Adjust berdasarkan traffic patterns
5. **Token Expiry**: Balance antara security dan user experience

## 📊 Monitoring & Logging

### Audit Logs
- Semua user actions logged ke `LogActivity` table
- Security events dengan detailed metadata
- Client information tracking (IP, User Agent)
- Performance indexes untuk efficient querying

### Health Check
```bash
GET /health
```

Returns:
```json
{
  "success": true,
  "timestamp": "2025-10-21T03:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## 🔄 Scheduled Jobs

### Token Cleanup
- **Frequency**: Setiap 1 jam
- **Function**: Cleanup expired dan revoked refresh tokens
- **Retention**: Revoked tokens dihapus setelah 30 hari

## 🧪 Testing Strategy

### Unit Tests
- Service layer business logic
- Middleware functionality
- Utility functions
- Mock dependencies untuk isolated testing

### Integration Tests
- End-to-end API workflows
- Database operations
- Authentication flows
- Error handling

### Coverage Goals
- Minimum 80% code coverage
- 100% coverage untuk critical security functions
- Regular security audit testing

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables dengan production values
- [ ] Enable scheduled jobs
- [ ] Setup database backup
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Enable HTTPS
- [ ] Setup monitoring dan alerting
- [ ] Regular security audits

### Docker Support (Coming Soon)
```dockerfile
# Dockerfile untuk containerization akan ditambahkan
```

## 📚 Contributing

1. Fork repository
2. Create feature branch
3. Add comprehensive tests
4. Ensure security best practices
5. Update documentation
6. Submit pull request

## 📄 License

[Specify License Here]

---

**Security Note**: Core backend ini telah mengimplementasikan security best practices termasuk refresh token management, comprehensive audit logging, rate limiting, input validation, dan testing. Namun, selalu lakukan security audit reguler dan update dependencies untuk maintenir keamanan sistem.