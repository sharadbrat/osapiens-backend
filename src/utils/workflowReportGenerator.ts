import { Task } from '../models/Task';
import { Workflow } from '../models/Workflow';

/**
 * Generates workflow reports in a human-readable string format.
 */
export class WorkflowReportGenerator {
    /**
     * Generates an aggregated report for the given workflow.
     *
     * @param workflow - The workflow object containing workflow details and tasks.
     * @returns A formatted string representing the workflow report.
     */
    public generateAggregatedReport(workflow: Workflow): string {
        let result = 'Workflow report:\n';
        result += `Workflow ID: ${workflow.workflowId}.\n`;
        result += `Status: ${workflow.status}.\n`;
        result += 'Tasks:\n';
        result += workflow.tasks.map((task) => `\t${this.stringifyTask(task)}`).join('\n');
        return result;
    }

    /**
     * Converts a task object into a formatted string representation.
     *
     * @param task - The task object to stringify.
     * @returns A string describing the task's properties.
     */
    private stringifyTask(task: Task): string {
        let result = '';
        result += `Task ID: ${task.taskId}, `;
        result += `Type: ${task.taskType}, `;
        result += `Status: ${task.status}, `;
        result += `Result: ${task.result?.data || 'none'}, `;
        result += `Error: ${task.result?.error || 'none'}`;
        return result;
    }
}
