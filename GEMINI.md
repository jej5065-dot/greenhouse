# Greenhouse - Plant Tracking & Inventory System

A full-stack application for managing plant inventory, tracking watering schedules, and recording propagation lineage.

## Architecture
- **Backend**: Spring Boot 3.4 (Java 21)
- **Database**: SQLite (local `greenhouse.db`)
- **Frontend**: React (TypeScript) + Vite + Material UI
- **Storage**: Local `uploads/` directory for plant photos

## Getting Started

### Prerequisites
- Java 21+
- Node.js 18+ & npm

### Running the Backend
```bash
./gradlew bootRun
```
The API will be available at `http://localhost:8080`.

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## MVP Features
- **Plant Inventory**: Comprehensive tracking with 20+ fields.
- **Search**: Fast search by ID, GUID, or Name.
- **Quick Actions**:
  - 💧 **Water**: Update last watered date instantly.
  - ✂️ **Propagate**: Create a new cutting from a parent plant.
- **Lineage**: Track parent/child relationships between plants.
- **Photo Support**: Upload and view plant photos.
- **Mobile Friendly**: Designed with Material Design for mobile browsers.