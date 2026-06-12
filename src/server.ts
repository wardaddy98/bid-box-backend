import baseRouter from '@/baseRouter';
import constants from '@/constants';
import connectDatabase from '@/utils/connectDatabase';
import logger from '@/utils/logger';
import SwaggerParser from '@apidevtools/swagger-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Response } from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { handleError } from './middlewares/handleError';
import { initializeSocketInstance } from './socket/socket';

(async () => {
  await connectDatabase();

  const { PORT, isProduction } = constants;

  const app: Express = express();

  // node HTTP server
  const server = http.createServer(app);

  initializeSocketInstance(server);

  app.use(
    cors({
      origin: ['http://localhost:8080', 'https://bidbox.suddathgautam.in'],
      methods: ['GET', 'POST', 'PUT', 'PATCH'],
      // to allow cookies when frontend and backend are on different domains
      credentials: true,
    }),
  );

  app.use(cookieParser());

  app.use(express.json());
  app.use(helmet());

  if (!isProduction) {
    const swaggerDocs = await SwaggerParser.dereference(
      path.join(process.cwd(), 'docs', 'openapi.yaml'),
    );
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }

  app.get('/', (_, res: Response) => {
    return res.json('Server live!');
  });

  app.use('/', baseRouter);

  //global error handler middleware which will catch custom class errors as well as uncaught errors
  app.use(handleError);

  server.listen(PORT, () => {
    logger.info(`Server live on Port: ${PORT}`);
  });
})();
