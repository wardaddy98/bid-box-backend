import dotenv from 'dotenv';
import { cleanEnv, port, str } from 'envalid';
dotenv.config();

const constants = cleanEnv(process.env, {
  PORT: port({ default: 3001 }),
  NODE_ENV: str({
    choices: ['development', 'staging', 'production'],
    default: 'development',
  }),
  DB_URI: str(),
  JWT_SECRET_KEY: str(),
  REFRESH_TOKEN_SECRET_KEY: str(),
  ADMIN_CODE: str(),
  SOCKET_ADMIN_PASSWORD: str(),
  AWS_ACCESS_KEY_ID: str(),
  AWS_ACCESS_KEY_SECRET: str(),
  AWS_S3_BUCKET_REGION: str(),
  AWS_S3_BUCKET_NAME: str(),
});
export default constants;
