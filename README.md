# My Own Redis

A full-stack application that implements a custom Redis-like in-memory data store with MongoDB persistence, complete with a modern analytics dashboard.

## 🚀 Project Overview

This project consists of two main components:
1.  **Server**: A Node.js/Express backend implementing a custom LRU (Least Recently Used) Cache and List data structures. It uses MongoDB for data persistence to ensure data durability beyond the in-memory cache.
2.  **Client**: A React-based dashboard (built with Vite) that allows users to interact with the cache, view statistics, and manage data in real-time.

## 🎓 Purpose & Education

This project was built out of pure curiosity to demonstrate how a **Redis-like system** works under the hood. It serves as an excellent case study for:
*   **Understanding Redis**: By building it from scratch, you get to see the internal mechanics of an in-memory store.
*   **Data Structures**: Any beginner with knowledge of basic data structures (Linked Lists, Hash Maps) can implement this.
*   **System Design**: A great way to learn about caching strategies, persistence, and client-server architecture.

## ✨ Features

### Backend (Server)
*   **LRU Cache Implementation**: Custom doubly-linked list & map implementation for O(1) cache operations.
*   **Persistence Strategy**: "Write-through" / "Cache-aside" hybrid.
    *   **Writes**: Updates both in-memory cache and MongoDB.
    *   **Reads**: Checks cache first. If miss, fetches from MongoDB and updates cache context.
*   **List Operations**: Supports Redis-style list commands (`lpush`, `rpush`, `lpop`, `rpop`).
*   **TTL (Time-To-Live)**: Support for expiring keys.
*   **Stats Tracking**: Tracks cache hits, misses, and database lookups.

### Frontend (Client)
*   **Real-time Dashboard**: Visualizes cache statistics (Hits vs DB Lookups).
*   **Interactive UI**:
    *   **Cache Management**: Add keys with TTL, get values, flush specific keys or flush all.
    *   **List Operations**: Push and Pop from both ends of the list.
*   **Modern Design**: Built with Tailwind CSS, Radix UI, and Lucide Icons for a polished look.

## 🛠️ Technology Stack

*   **Server**: Node.js, Express.js, Mongoose (MongoDB ODM).
*   **Client**: React, Vite, TypeScript, Tailwind CSS, Recharts, Radix UI.
*   **Database**: MongoDB.

## 📋 Prerequisites

*   [Node.js](https://nodejs.org/) (v14+ recommended)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Running locally on default port `27017`)

## ⚙️ Installation & Setup

### 1. Database Setup
Ensure your local MongoDB instance is running:
```bash
# On Windows (if installed as service)
# Usually runs automatically, or:
net start MongoDB
```

### 2. Server Setup
Navigate to the server directory, install dependencies, and start the backend.

```bash
cd server
npm install
node index.js
```
*The server will run at `http://localhost:3000`*

> **Note**: The server attempts to connect to `mongodb://127.0.0.1:27017/memorystore`. Ensure this matches your local configuration.

### 3. Client Setup
Navigate to the client directory, install dependencies, and start the development server.

```bash
cd client
npm install
npm run dev
```
*The client dashboard will typically run at `http://localhost:5173`*

## 🔌 API Reference

The server exposes the following REST endpoints:

### Cache & KV Operations
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/put` | `{key, value}` | Add key-value to Cache and DB. |
| `POST` | `/cache` | `{key, value, ttl}` | Add key-value to Cache only (with optional TTL in seconds). |
| `GET` | `/get/:key` | - | Retrieve value. Checks Cache -> then DB. |
| `GET` | `/getall` | - | Get all current items in the cache. |
| `DELETE` | `/flush/:key` | - | Remove a specific key from cache. |
| `DELETE` | `/flush-all` | - | Create the cache and reset stats. |

### List Operations
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/lpush` | `{value}` | Push value to left (head) of list. |
| `POST` | `/rpush` | `{value}` | Push value to right (tail) of list. |
| `DELETE` | `/lpop` | - | Remove & return value from left. |
| `DELETE` | `/rpop` | - | Remove & return value from right. |
| `GET` | `/lget` | - | Get entire list. |

### System
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/stats` | - | Get cache hit/miss stats and size. |

## ⚠️ Known Implementation Details

*   **List Persistence**: Currently, `list` operations are in-memory only and are not persisted to MongoDB (unlike Key-Value pairs).
*   **Codebase Note**: Ensure `server/datastructures.js` correctly exports the `list` array for list operations to function. If you encounter errors with list operations, check that `const list = []` is defined and exported in that file.
