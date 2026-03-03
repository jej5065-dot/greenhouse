# Greenhouse - Plant Tracking & Inventory System

A full-stack application for managing plant inventory, tracking watering schedules, and recording propagation lineage.

## Architecture
- **Backend**: Spring Boot 3.4 (Java 21)
- **Database**: SQLite (local `greenhouse.db`)
- **Frontend**: React (TypeScript) + Vite + Material UI
- **Storage**: Local `uploads/` directory for plant photos

## Engineering Guidelines

### Verification Priority
- **Backend First**: Always verify that the backend builds successfully (e.g., `./gradlew compileJava` or `./gradlew build`) before attempting to start the frontend or verify local server availability. 
- **Fail Fast**: If the backend build fails, stop immediately, fix the compilation or test errors, and do not waste time waiting for frontend processes until the core system is stable.

## Getting Started

### Prerequisites
- Java 21+
- Node.js 18+ & npm

### Running the Application

#### Option 1: Development Mode (Hot Reload)
Run the backend and frontend as separate processes for the best development experience.

1. **Start the Backend**:
   ```bash
   ./gradlew bootRun
   ```
   The API will be available at `http://localhost:8080`.

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`. Vite is configured to proxy `/api` and `/uploads` requests to the backend.

#### Option 2: Standalone Production Mode (Built JAR)
This mode builds the frontend and bundles it directly into the Spring Boot JAR.

1. **Build and Run**:
   ```bash
   ./gradlew bootRun
   ```
   *Note: The `build.gradle` is configured to automatically build and copy the frontend into the backend's static resources when building the JAR.*

2. **Access**:
   Open `http://localhost:8080` in your browser.

#### Option 3: Local Production Proxy (Node.js)
If you want to test the production frontend build using the Node.js proxy server:

1. **Build the JAR** (ensures frontend assets are generated):
   ```bash
   ./gradlew bootJar
   ```

2. **Start the Proxy Server**:
   ```bash
   node serve-frontend.js
   ```
   The application will be available at `http://localhost:3000`.

## Deployment

**Mandatory Procedure**: To deploy the application to the remote server, you **must** use the following Gradle task. Do not perform manual `scp` or `ssh` steps unless the task itself is being debugged.

```bash
./gradlew deployToRemote
```

### Deployment Requirements
- **Node.js**: `npm` must be available in the environment path where Gradle is running.
- **SSH Access**: Public key authentication should be configured for `jjones@192.168.68.86`.

This task autonomously handles:
1.  Building frontend production assets.
2.  Bundling assets into the Spring Boot JAR.
3.  Uploading the JAR to the remote host (`192.168.68.86`).
4.  Restarting the `greenhouse` service.

The remote application is available at `http://192.168.68.86:3000`.

## MVP Features
- **Plant Inventory**: Comprehensive tracking with 20+ fields.
- **Search**: Fast search by ID, GUID, or Name.
- **Quick Actions**:
  - 💧 **Water**: Update last watered date instantly.
  - ✂️ **Propagate**: Create a new cutting from a parent plant.
- **Lineage**: Track parent/child relationships between plants.
- **Photo Support**: Upload and view plant photos.
- **Mobile Friendly**: Designed with Material Design for mobile browsers.