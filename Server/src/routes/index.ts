import { Router } from 'express';
import { espaciosRouter } from './espacios.js';
import { viajesRouter } from './viajes.js';
import { reservasRouter } from './reservas.js';

export const api = Router();

api.use('/espacios', espaciosRouter);
api.use('/viajes', viajesRouter);
api.use('/reservas', reservasRouter);
