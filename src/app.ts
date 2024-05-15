import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { connect, set } from 'mongoose';
import { AppConfig } from '@/config';
import { Routes } from '@/interfaces/routes.interface';
import errorMiddleware from '@/middlewares/error.middleware';
import { LoggerMiddleware } from './middlewares/http-logger.middleware';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public toLog: LoggerMiddleware;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = AppConfig.env || 'development';
    this.port = AppConfig.port || 3000;
    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
    this.toLog = new LoggerMiddleware();
  }

  public listen() {
    this.app.listen(this.port, () => {
      this.toLog.logger.log(`=================================`);
      this.toLog.logger.log(`======= ENV: ${this.env} =======`);
      this.toLog.logger.log(`🚀 App listening on the port ${this.port}`);
      this.toLog.logger.log(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private connectToDatabase() {
    if (this.env !== 'production') {
      set('debug', true);
    }

    connect(AppConfig.dbConnection);
  }

  private initializeMiddlewares() {
    const stream = {
      write: (message: string) => {
        this.toLog.logger.log(message.substring(0, message.lastIndexOf('\n')));
      },
    };
    this.app.use(morgan(AppConfig.log_format, { stream }));
    this.app.use(cors({ origin: AppConfig.origin, credentials: AppConfig.credential }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
