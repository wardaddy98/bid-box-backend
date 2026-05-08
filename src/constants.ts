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
});
export default constants;
