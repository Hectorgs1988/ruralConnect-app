import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { api } from './routes/index.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Permitir front en dev
const origins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());
app.use(cors({ origin: origins, credentials: true }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api', api);

// Manejo de errores
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(err?.status || 500).json({ error: err?.message || 'Internal Server Error' });
});

export { app };
