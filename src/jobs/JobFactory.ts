import { Job } from './Job';
import { DataAnalysisJob } from './DataAnalysisJob';
import { EmailNotificationJob } from './EmailNotificationJob';
import { PolygonAreaJob } from './PolygonAreaJob';
import { ReportGenerationJob } from './ReportGenerationJob';

export class JobFactory {
    private static readonly jobMap: Record<string, () => Job<any>> = {
        analysis: () => new DataAnalysisJob(),
        notification: () => new EmailNotificationJob(),
        polygonArea: () => new PolygonAreaJob(),
        reportGeneration: () => new ReportGenerationJob(),
    };

    public static get(taskType: string): Job<any> {
        const factoryMethod = this.jobMap[taskType];
        if (!factoryMethod) {
            throw new Error(`No job found for task type: ${taskType}`);
        }
        return factoryMethod();
    }
}
