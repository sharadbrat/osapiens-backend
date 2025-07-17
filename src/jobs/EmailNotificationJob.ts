import { Job } from './Job';
import { Task } from '../models/Task';
import { Logger } from '../utils/logger';

export class EmailNotificationJob implements Job<void> {
    private readonly logger: Logger = Logger.withPrefix('EmailNotificationJob');

    async run(task: Task): Promise<void> {
        this.logger.log(`Sending email notification for task ${task.taskId}...`);
        // Perform notification work
        await new Promise<void>((resolve, reject) =>
            setTimeout(() => {
                // Randomly failing task
                const random = Math.random();
                if (random < 0.2) {
                    this.logger.error('Failed to send email!');
                    reject(Error('Failed to send email'));
                } else {
                    this.logger.log('Email sent!');
                    resolve();
                }
            }, 500),
        );
    }
}
