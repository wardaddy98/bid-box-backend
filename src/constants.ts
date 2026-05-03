import dotenv from 'dotenv';
import { cleanEnv, port, str } from 'envalid';
dotenv.config();



 interface IConstants{
    PORT: number;
    NODE_ENV?:'development'| 'staging'| 'production';
    DB_URI: string
 }

const constants = cleanEnv(process.env, {
    PORT: port({default:3001}),
    NODE_ENV: str({choices:['development', 'staging', 'production']}),
    DB_URI: str()
})
export default constants