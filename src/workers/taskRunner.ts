import { Repository } from 'typeorm';
import { Task } from '../models/Task';
import { WorkflowStatus } from '../workflows/WorkflowFactory';
import { Workflow } from '../models/Workflow';
import { Result } from '../models/Result';
import { AppDataSource } from '../data-source';
import { JobFactory } from '../jobs/JobFactory';
import { Logger } from '../utils/logger';
import { JobContext } from '../jobs/JobContext';
import { WorkflowReportGenerator } from '../utils/workflowReportGenerator';

/**
 * Represents the possible statuses for a task in the task runner.
 *
 * @enum {string}
 */
export enum TaskStatus {
    Queued = 'queued',
    InProgress = 'in_progress',
    Completed = 'completed',
    Failed = 'failed',
    Skipped = 'skipped',
}

/**
 * The TaskRunner class is responsible for executing jobs based on the provided task's type,
 * managing the task's status, progress, and results, and updating the workflow status accordingly.
 *
 * @example
 * ```typescript
 * const runner = new TaskRunner();
 * await runner.run(task);
 * ```
 */
export class TaskRunner {
    private readonly taskRepository: Repository<Task> = AppDataSource.getRepository(Task);
    private readonly resultRepository: Repository<Result> = AppDataSource.getRepository(Result);
    private readonly workflowRepository: Repository<Workflow> = AppDataSource.getRepository(Workflow);
    private readonly logger: Logger = Logger.withPrefix('TaskRunner');

    /**
     * Runs the appropriate job based on the task's type, managing the task's status.
     * @param task - The task entity that determines which job to run.
     * @throws If the job fails, it rethrows the error.
     */
    async run(task: Task): Promise<void> {
        task.status = TaskStatus.InProgress;
        task.progress = 'starting job...';
        await this.taskRepository.save(task);
        const job = JobFactory.get(task.taskType);
        const result = new Result();

        try {
            this.logger.log(`Starting job ${task.taskType} for task ${task.taskId}...`);
            const context = this.getJobContext(task);
            const taskResult = await job.run(task, context);
            this.logger.log(`Job ${task.taskType} for task ${task.taskId} completed successfully.`);
            result.data = JSON.stringify(taskResult || {});
            task.result = result;
            task.status = TaskStatus.Completed;
            task.progress = null;
        } catch (error: any) {
            this.logger.error(`Error running job ${task.taskType} for task ${task.taskId}:`, error);

            task.status = TaskStatus.Failed;
            task.progress = null;
            if (task.dependant) {
                task.dependant.status = TaskStatus.Skipped;
            }
            result.error = error?.message || error;

            throw error;
        } finally {
            await this.resultRepository.save(result);
            await this.taskRepository.save(task);
            if (task.dependant) {
                await this.taskRepository.save(task.dependant);
            }
        }

        const currentWorkflow = await this.workflowRepository.findOne({
            where: { workflowId: task.workflow.workflowId },
            relations: ['tasks'],
        });

        if (currentWorkflow) {
            const allCompleted = currentWorkflow.tasks.every((t) => t.status === TaskStatus.Completed);
            const anyFailed = currentWorkflow.tasks.some((t) => t.status === TaskStatus.Failed);

            if (anyFailed) {
                currentWorkflow.status = WorkflowStatus.Failed;
            } else if (allCompleted) {
                currentWorkflow.status = WorkflowStatus.Completed;
            } else {
                currentWorkflow.status = WorkflowStatus.InProgress;
            }

            this.generateWorkflowFinalResult(currentWorkflow);

            await this.workflowRepository.save(currentWorkflow);
        }
    }

    /**
     * Constructs a {@link JobContext} for the given task, including the outputs of its dependencies.
     *
     * Iterates over the task's dependencies, if any, and collects the `data` property from each dependency's result.
     * These outputs are then passed along with the task's workflow to the {@link JobContext} constructor.
     *
     * @param task - The task for which to create the job context. May have dependencies whose results are included.
     * @returns A new {@link JobContext} instance containing the workflow and the outputs of the dependencies.
     */
    private getJobContext(task: Task): JobContext {
        const dependenciesOutputs: any[] = [];
        if (task.dependencies) {
            task.dependencies?.forEach((dependency: Task) => {
                dependenciesOutputs.push(dependency.result?.data);
            });
        }

        return new JobContext(task.workflow, dependenciesOutputs);
    }

    /**
     * Generates the final aggregated result for the given workflow and assigns it to the workflow's `finalResult` property.
     *
     * This method uses the `WorkflowReportGenerator` to create an aggregated report based on the provided workflow.
     *
     * @param workflow - The workflow instance for which the final result is to be generated.
     */
    private generateWorkflowFinalResult(workflow: Workflow) {
        const reportGenerator = new WorkflowReportGenerator();
        const finalResult = reportGenerator.generateAggregatedReport(workflow);
        workflow.finalResult = finalResult;
    }
}
