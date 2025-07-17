import 'reflect-metadata';
import express from 'express';
import analysisRoutes from './routes/analysisRoutes';
import workflowRoutes from './routes/workflowRoutes';
import defaultRoute from './routes/defaultRoute';
import { taskWorker } from './workers/taskWorker';
import { AppDataSource } from './data-source'; // Import the DataSource instance
import { Logger } from './utils/logger';

const app = express();
app.use(express.json());
app.use('/analysis', analysisRoutes);
app.use('/workflow', workflowRoutes);
app.use('/', defaultRoute);

const logger = Logger.withPrefix('App');

AppDataSource.initialize()
    .then(() => {
        // Start the worker after successful DB connection
        taskWorker();

        app.listen(3000, () => {
            logger.log('Server is running at http://localhost:3000');
        });
    })
    .catch((error) => logger.log(error));
