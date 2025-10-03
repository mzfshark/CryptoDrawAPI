import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { router as apiRouter } from './routes/index.js';

const app = express();
const corsOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use('/api', apiRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

console.log('Starting CryptoDraw API server...');
console.log('CORS origin:', corsOrigin);

app.listen(port, () => {
  console.log(`✅ [CryptoDraw API] Server listening on http://localhost:${port}`);
  console.log('📊 Health check: GET /api/health');
  console.log('🎟️  Tickets API: GET /api/tickets/*');
  console.log('🎯 Draws API: GET /api/draws/*');
  console.log('📈 Stats API: GET /api/stats/*');
});
