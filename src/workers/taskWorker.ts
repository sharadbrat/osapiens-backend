import { AppDataSource } from '../data-source';
import { Task } from '../models/Task';
import { Logger } from '../utils/logger';
import { TaskRunner, TaskStatus } from './taskRunner';

export async function taskWorker() {
    const logger = Logger.withPrefix('TaskWorker');
    const taskRepository = AppDataSource.getRepository(Task);
    const taskRunner = new TaskRunner();

    while (true) {
        logger.log('Querying for tasks.');
        const task = await taskRepository.findOne({
            where: { status: TaskStatus.Queued },
            // sort tasks by workflowId (workflows that are created earlier should execute first)
            // and by stepNumber (to ensure tasks within same workflow are executed in the right order)
            order: { workflowId: 'asc', stepNumber: 'asc' },
            // Include workflow and dependant task
            relations: ['workflow', 'dependant'],
        });

        if (task) {
            try {
                logger.log(`Executing task, id: ${task.taskId}, type: ${task.taskType}, clientId: ${task.clientId}`);
                await taskRunner.run(task);
                logger.log(`Task execution finished, id: ${task.taskId}, result: ${task.result.data}`);
            } catch (error) {
                logger.error(`Task execution failed, id: ${task.taskId}, error:`, error);
            }
        }

        // Wait before checking for the next task again
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}
