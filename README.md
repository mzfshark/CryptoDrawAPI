Whostler API (CryptoDraw backend)

Overview
- Express + TypeScript API extracted from CryptoDraw to run at whostler.com/api.

Quick start
1) Install deps
   - npm install
2) Run dev server
   - npm run dev
3) Health check
   - GET http://localhost:3000/api/health

Environment
- FRONTEND_ORIGIN: CORS allow origin (default "*")
- PORT: server port (default 3000)

Endpoints
- GET /api/health -> { ok, ts }
- GET /api/tickets/:ticketId
- GET /api/tickets/user/:address?game=&status=&limit=&offset=
- GET /api/tickets/:ticketId/proof?drawId=
- POST /api/tickets/validate { numbers, game }

Notes
- BlockchainService is a stub. Replace with real on-chain/indexer integration using your ABIs and RPC.
