# AWS Practice Test Application - 3-Tier Architecture

A secure 3-tier architecture implementation of the AWS practice test application with React frontend, Node.js/Express backend, and PostgreSQL database.

## Architecture

- **Client Tier**: React frontend application
- **Server Tier**: Node.js/Express REST API with JWT authentication
- **Database Tier**: PostgreSQL with migrated test data

## Features

- User authentication (registration/login)
- All existing practice modes: Random Practice, Mock Test, Practice Mode
- New Study Mode with progress tracking
- Mock Test result history
- Secure API with SQL injection and XSS prevention
- Cross-device progress continuity

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 16+ (for local development)

### Development Setup

1. Clone the repository and navigate to the project directory

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start all services with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Manual Setup (without Docker)

1. Set up PostgreSQL database:
   ```bash
   createdb aws_practice
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   npm run migrate
   npm run dev
   ```

3. Install client dependencies:
   ```bash
   cd client
   npm install
   npm start
   ```

## Project Structure

```
├── client/                 # React frontend
├── server/                 # Node.js/Express backend
├── docker-compose.yml      # Docker orchestration
├── .env                    # Environment variables
└── README.md              # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Tests
- `GET /api/tests` - Get all available tests
- `GET /api/tests/:id/questions` - Get questions for a test

### Progress (Protected)
- `POST /api/progress/study` - Save Study Mode progress
- `GET /api/progress/study/:testId` - Get Study Mode progress
- `POST /api/progress/mock-test` - Save Mock Test results
- `GET /api/progress/mock-tests` - Get Mock Test history
- `GET /api/progress/stats` - Get user statistics

## Development

### Database Migrations

Run migrations:
```bash
cd server
npm run migrate
```

Reset database:
```bash
cd server
npm run migrate:reset
```

### Environment Variables

See `.env.example` for all available configuration options.

## Security Features

- bcrypt password hashing
- JWT token authentication
- SQL injection prevention via parameterized queries
- XSS attack prevention via input sanitization
- CORS configuration
- Rate limiting
- Input validation

## Deployment

The application is designed for AWS deployment:
- Frontend: S3 + CloudFront
- Backend: EC2
- Database: RDS PostgreSQL

## License

MIT