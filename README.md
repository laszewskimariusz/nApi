# ✈️ nApi – Newsky Data Interface

**nApi** is an internal admin panel designed to monitor and automate the process of fetching flight data from the [Newsky](https://newsky.app) platform using their official API.  
It connects to a MongoDB database and provides a clean web interface for overseeing synchronization and system health.

---

## 🔧 Features

- 🔐 Web panel with authentication
- 📊 Dashboard with:
  - Total number of flights stored
  - Database connection status
  - List of the 5 most recently added flights
- 🪵 Operational logs (success/error/info)
- 🔁 Cron-based background task to fetch new data from the Newsky API
- ☁️ Docker-compatible and easy to deploy

---

## 🧱 Tech Stack

- **Next.js** (App Router)
- **Tailwind CSS** with **shadcn/ui** components (dark mode)
- **MongoDB**
- **node-cron** for scheduled background jobs
- **Axios** for API requests to Newsky

---

## 📦 MongoDB Collections

- `flights` – all fetched flight data
- `logs` – internal system logs and errors
- `status` – (optional) heartbeat or app state info

---

## 🚀 Requirements

- Node.js **v18+**
- MongoDB instance (local or remote)
- **Newsky API key** with the `flights` permission scope

---

## 📌 Coming soon

- Admin login via Google Auth
- Error alerting system (email / Discord)
- Manual flight data re-fetch
- API usage statistics (rate limits, retries)

---

## 📄 License

This project is internal and proprietary. Do not distribute without permission.
