# XenoCRM — AI-Native Marketing CRM Monorepo

XenoCRM is a next-generation **AI-Native Marketing CRM** designed for consumer brands (such as **BrewLux**, our fictional premium coffee chain) to target and message shoppers across WhatsApp, SMS, Email, and RCS.

This monorepo scaffolds the entire mini CRM system:
1. **Frontend**: React + Vite + Tailwind CSS + Recharts (Dashboard, Customer Explorer, AI Assistant chat, and Campaign Funnel analytics).
2. **CRM Backend**: Express.js with Mongoose models, Mongoose schemas with proper indexing, and insights aggregation endpoints.
3. **Channel Service**: A separate Node.js Express stub service to simulate asynchronous messaging cascades (Queued → Sent → Delivered → Read → Clicked → Converted).
4. **AI Assistant**: Conversational Claude agent framework with tool-calling capabilities.

---

## 🛠️ Architecture & Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS (v4) + Lucide Icons + Recharts
- **Backend**: Node.js + Express.js + Mongoose + MongoDB + Socket.IO
- **Simulated messaging channel**: Node.js + Express.js stub simulating delays and delivery statuses
- **Containerization**: Docker & Docker Compose

---

## 📦 Directory Tree & Project Structure
```text
/xenocrm
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Assistant.jsx      ← AI chat workspace
│   │   │   ├── Dashboard.jsx      ← Analytics insights
│   │   │   ├── Customers.jsx      ← Customer profile explorer
│   │   │   └── CampaignDetail.jsx ← Live funnel tracking
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── MessageList.jsx
│   │   │   │   ├── ToolCard.jsx
│   │   │   │   └── InputBar.jsx
│   │   │   └── Campaign/
│   │   │       ├── Funnel.jsx
│   │   │       └── Timeline.jsx
│   │   └── App.jsx
│   ├── .env.example
│   └── Dockerfile
├── backend/
│   ├── models/
│   │   ├── Customer.js            ← Customer schema + indexes
│   │   ├── Order.js               ← Orders details + indexes
│   │   ├── Segment.js             ← Customer segments + rules
│   │   ├── Campaign.js            ← Campaigns + stats
│   │   └── Communication.js       ← Dispatch delivery logs + indexes
│   ├── routes/
│   │   ├── agent.js               ← AI assistant chat + SSE
│   │   ├── campaigns.js           ← Campaign launch engine
│   │   ├── receipt.js             ← Delivery callback webhook receiver
│   │   ├── customers.js           ← Customers query/filters
│   │   └── insights.js            ← Dashboard analytics aggregation
│   ├── tools/                     ← Claude tool handlers
│   │   ├── queryCustomers.js
│   │   ├── createSegment.js
│   │   ├── draftMessage.js
│   │   ├── launchCampaign.js
│   │   └── getCampaignStats.js
│   ├── seed.js                    ← Seeding engine (500 customers, 2000 orders)
│   ├── index.js                   ← Express entrypoint & Socket.IO
│   ├── .env.example
│   └── Dockerfile
├── channel-service/
│   ├── index.js                   ← Webhook simulation
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml             ← Orchestration profile
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (or in Docker)

### 1. Backend Seeding and Startup
First, set up your backend configurations:
```bash
cd backend
cp .env.example .env
npm install
```

Make sure MongoDB is running on `mongodb://localhost:27017/xenocrm`.
Run the faker-driven seed script to populate **500 customers**, **2000 orders**, and initial segments:
```bash
npm run seed
```
Start the CRM backend API:
```bash
npm run dev
```

### 2. Channel Service Startup
Open another terminal:
```bash
cd channel-service
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend Startup
Open another terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🐋 Running via Docker Compose
To boot up the entire stack (MongoDB, Backend, Channel Service, Frontend) together:
1. Make sure you set your Anthropic API Key in the environment or in the docker-compose.yml file.
2. Run:
```bash
docker-compose up --build
```
3. To seed database inside the container:
```bash
docker-compose exec backend npm run seed
```
