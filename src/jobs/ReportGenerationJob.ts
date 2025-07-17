import { Job } from './Job';
import { Task } from '../models/Task';
import { AppDataSource } from '../data-source';
import { Workflow } from '../models/Workflow';
import { Logger } from '../utils/logger';
import { WorkflowReportGenerator } from '../utils/workflowReportGenerator';

type Report = {
    workflowId: string;
    tasks: {
        taskId: string;
        type: string;
        result: string | null;
    }[];
    finalReport: string;
};

export class ReportGenerationJob implements Job<Report> {
    private readonly workflowRepository = AppDataSource.getRepository(Workflow);
    private readonly logger: Logger = Logger.withPrefix('ReportGenerationJob');

    async run(task: Task): Promise<Report> {
        this.logger.log(`Running report generation for workflow ${task.workflow.workflowId}...`);

        // Load workflow with all tasks and their results
        const workflow = await this.workflowRepository.findOne({
            where: { workflowId: task.workflow.workflowId },
            relations: {
                tasks: {
                    result: true,
                },
            },
        });

        if (!workflow) {
            throw new Error(`Workflow with ID ${task.workflow.workflowId} not found`);
        }

        const reportGenerator = new WorkflowReportGenerator();
        const finalReport = reportGenerator.generateAggregatedReport(workflow);

        const result = {
            workflowId: workflow.workflowId,
            tasks: workflow.tasks.map((task) => ({
                taskId: task.taskId,
                type: task.taskType,
                status: task.status,
                result: task.result?.data,
                error: task.result?.error,
            })),
            finalReport,
        };

        this.logger.log(finalReport);

        return result;
    }
}
