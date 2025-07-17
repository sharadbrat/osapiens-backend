import { Workflow } from "../models/Workflow";

/**
 * JobContext class provides context for job execution, including workflow details,
 * input data, and outputs from dependent tasks.
 */
export class JobContext {
    public get input(): any {
        const input = this.workflow.input;
        if (!input) {
            return null;
        }

        return JSON.parse(input);
    }

    public constructor(public readonly workflow: Workflow, public readonly dependenciesOutputs: any[]) {
    }
}
