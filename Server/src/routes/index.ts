import { Router } from 'express';
import { espaciosRouter } from './espacios.js';

export const api = Router();

api.use('/espacios', espaciosRouter);
