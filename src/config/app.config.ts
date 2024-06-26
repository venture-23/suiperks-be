import { config } from 'dotenv';
config();

const AppConfig = {
  env: process.env.NODE_ENV,
  versioning: process.env.VERSIONING,
  port: parseInt(process.env.PORT),
  dbConnection: process.env.MONGO_URI,
  log_dir: process.env.LOG_DIR,
  credential: Boolean(parseInt(process.env.CREDENTIALS)),
  log_format: process.env.LOG_FORMAT,
  origin: process.env.ORIGIN,
  secret: process.env.SECRET,
  signature_msg: process.env.SIGNATURE_MESSAGE,
  mnemonic: process.env.MNEMONICS,
  package_id: process.env.PACKAGE_ID,
  dao_treasury: process.env.DAO_TREASURY,
  auction_detail: process.env.AUCTION_DETAIL,
  admin_cap: process.env.ADMIN_CAP,
  directory: process.env.DIRECTORY,
} as const;

export default AppConfig;
