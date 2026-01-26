# Business Nexus

A comprehensive web platform for business connections, connecting startups, investors, and professionals.

## Tech Stack

**Frontend:**

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (Icons)

**Backend:**

- Node.js
- Express
- MongoDB (Mongoose)
- TypeScript

## Prerequisites

Before running this project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a cloud instance like MongoDB Atlas)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd Nexus
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

1.  **Backend Environment Variables:**
    Create a `.env` file in the root directory based on `.env.example`:

    ```bash
    cp .env.example .env
    ```

    Update the `.env` file with your specific configuration, particularly the `MONGODB_URL` if you are not using a local default instance.

    ```env
    PORT=3001
    MONGODB_URL=mongodb://localhost:27017/business-nexus
    ```

## Running the Project

You will need to run the backend and frontend in separate terminal windows.

### 1. Start the Backend Server

The backend requires a running MongoDB instance. Make sure MongoDB is started.

In the first terminal window, run:

```bash
npx tsx watch backend/server.ts
```

The server should start on port `3001` and connect to MongoDB.

### 2. Start the Frontend Application

In a second terminal window, run:

```bash
npm run dev
```

The frontend will start (usually on `http://localhost:5173`) and will automatically connect to the backend at `http://localhost:3001`.

## Building for Production

To build the frontend for production:

```bash
npm run build
```

## Project Structure

- `src/` - Frontend source code (React components, pages, services)
- `backend/` - Backend source code (Express server, Mongoose models, routes)
- `public/` - Static assets
