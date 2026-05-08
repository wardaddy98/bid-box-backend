import baseRouter from '@/baseRouter';
import constants from '@/constants';
import connectDatabase from '@/utils/connectDatabase';
import logger from '@/utils/logger';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { handleError } from './middlewares/handleError';

(async () => {
  await connectDatabase();

  const { PORT, isProduction } = constants;

  const app: Express = express();

  app.use(
    cors({
      origin: ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH'],
    }),
  );

  app.use(express.json());
  app.use(helmet());

  if (!isProduction) {
    const swaggerDocs = YAML.load(path.join(process.cwd(), 'docs', 'openapi.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }

  app.use('/', baseRouter);

  //global error handler middleware which will catch custom class errors as well as uncaught errors
  app.use(handleError);

  app.listen(PORT, () => {
    logger.info(`Server live on Port: ${PORT}`);
  });
})();
