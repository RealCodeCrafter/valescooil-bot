// import routes
import express from 'express';
import 'reflect-metadata';
// import session from "express-session";
import { addMethodToResponse } from '../common/utility/add-response-method';
import { globalErrorHandler } from '../common/utility/global-error-handler';
import { router } from './router';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3200',
    'http://localhost:5173',
    'http://31.128.36.192:5173',
    'https://31.128.36.192',
    'http://campaign.uz/',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(addMethodToResponse)
  .use(router)
  .use(globalErrorHandler);

export default app;
