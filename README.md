# MCQ Test Platform - Server

Simple Node.js + Express backend for MCQ exam APIs.

## Setup

1. Install dependencies:
   - `npm install`
2. Add `.env` in the server folder:
   - `MONGODB_URI=your_mongodb_uri`
   - `JWT_SECRET=your_secret`
   - `PORT=4000`
   - `CORS_ORIGIN=http://localhost:3000`
3. Seed sample data:
   - `npm run seed`
4. Start server:
   - `npm run dev`

## API Base URL

- `http://localhost:4000/api`

## Health Check

- `GET http://localhost:4000/health`
