import constants from '@/constants';
import path from 'node:path';
import winston from 'winston';
const { isProduction } = constants;

const stringLogFormat = winston.format.printf(({ timestamp, level, message, ...metadata }) => {
  const metaString = Object.keys(metadata).length ? `\n${JSON.stringify(metadata, null, 2)}` : '';
  return `[${level}]: ${timestamp} - ${message}${metaString}`;
});

const jsonLogFormat = winston.format.printf(({ timestamp, level, message, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...metadata,
  });
});

const consoleTransport: winston.transports.ConsoleTransportInstance =
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({
        format: 'DD-MM-YYYY HH:mm:ss',
      }),
      stringLogFormat,
    ),

    level: isProduction ? 'info' : 'debug',
  });

const fileTransport: winston.transports.FileTransportInstance = new winston.transports.File({
  filename: path.join(process.cwd(), 'logs', 'errors.log'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'DD-MM-YYYY HH:mm:ss',
    }),
    jsonLogFormat,
  ),

  level: 'error',
});

const logger = winston.createLogger({
  handleExceptions: true,
  handleRejections: true,
  transports: [consoleTransport],
});
logger.add(fileTransport);

if (isProduction) {
  logger.add(fileTransport);
}

export default logger;
