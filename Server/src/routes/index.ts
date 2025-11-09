import { Router } from 'express';
import { espaciosRouter } from './espacios.js';
import { viajesRouter } from './viajes.js';
import { reservasRouter } from './reservas.js';
import { auth } from './auth.js';
import { eventosRouter } from './eventos.js';
import { usersRouter } from "./users.js"; 

export const api = Router();

api.use('/auth', auth);
api.use('/espacios', espaciosRouter);
api.use('/viajes', viajesRouter);
api.use('/reservas', reservasRouter);
api.use('/eventos', eventosRouter);
api.use('/users', usersRouter);
