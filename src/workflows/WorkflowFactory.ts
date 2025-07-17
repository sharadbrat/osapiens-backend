import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { DataSource, Repository } from 'typeorm';
import { Workflow } from '../models/Workflow';
import { Task } from '../models/Task';
import { TaskStatus } from '../workers/taskRunner';

export enum WorkflowStatus {
    Initial = 'initial',
    InProgress = 'in_progress',
    Completed = 'completed',
    Failed = 'failed',
}

interface WorkflowStep {
    taskType: string;
    stepNumber: number;
    dependsOn?: number[];
}

interface WorkflowDefinition {
    name: string;
    steps: WorkflowStep[];
}

/**
 * Factory class responsible for creating and managing `Workflow` and `Task` entities.
 *
 * The `WorkflowFactory` provides methods to construct workflows from YAML definitions,
 * validate workflow structures, and initialize tasks with dependencies. It interacts
 * with the database via repositories for persistence.
 *
 * @example
 * ```typescript
 * const factory = new WorkflowFactory(dataSource);
 * const workflow = await factory.createWorkflowFromYAML('path/to/workflow.yaml', 'client123', inputData);
 * ```
 *
 * @see Workflow
 * @see Task
 * @see WorkflowDefinition
 */
export class WorkflowFactory {
    private readonly workflowRepository: Repository<Workflow>;
    private readonly taskRepository: Repository<Task>;

    constructor(private dataSource: DataSource) {
        this.workflowRepository = this.dataSource.getRepository(Workflow);
        this.taskRepository = this.dataSource.getRepository(Task);
    }

    /**
     * Creates a workflow by reading a YAML file and constructing the Workflow and Task entities.
     * @param filePath - Path to the YAML file.
     * @param clientId - Client identifier for the workflow.
     * @param geoJson - The geoJson data string for tasks (customize as needed).
     * @returns A promise that resolves to the created Workflow.
     */
    async createWorkflowFromYAML(filePath: string, clientId: string, input: any): Promise<Workflow> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const workflowDefinition = this.parseWorkflowDefinition(fileContent);
        this.validateWorkflowDefinition(workflowDefinition);

        const workflow = this.createWorkflow(clientId, input);
        const savedWorkflow = await this.workflowRepository.save(workflow);

        const tasks = this.createTasks(workflowDefinition, savedWorkflow);
        this.populateDependencies(workflowDefinition, tasks);
        await this.taskRepository.save(tasks);

        return savedWorkflow;
    }

    /**
     * Creates a new `Workflow` instance with the specified client ID and input data.
     *
     * @param clientId - The unique identifier for the client associated with the workflow.
     * @param input - The input data for the workflow, which will be serialized to JSON.
     * @returns A newly created `Workflow` object with initial status and input set.
     */
    private createWorkflow(clientId: string, input: any): Workflow {
        const workflow = new Workflow();
        workflow.clientId = clientId;
        workflow.status = WorkflowStatus.Initial;
        workflow.input = JSON.stringify(input);

        return workflow;
    }

    /**
     * Creates an array of {@link Task} instances based on the provided {@link WorkflowDefinition} and {@link Workflow}.
     *
     * Each task is initialized with properties from the workflow and the corresponding step in the workflow definition.
     * The tasks are assigned the status {@link TaskStatus.Queued} and linked to the workflow.
     *
     * @param workflowDef - The definition of the workflow containing the steps to create tasks for.
     * @param workflow - The workflow instance to associate the tasks with.
     * @returns An array of initialized {@link Task} objects for each step in the workflow definition.
     */
    private createTasks(workflowDef: WorkflowDefinition, workflow: Workflow): Task[] {
        const tasks: Task[] = workflowDef.steps.map((step) => {
            const task = new Task();
            task.clientId = workflow.clientId;
            task.status = TaskStatus.Queued;
            task.taskType = step.taskType;
            task.stepNumber = step.stepNumber;
            task.workflow = workflow;
            task.workflowId = workflow.workflowId;
            return task;
        });

        return tasks;
    }

    /**
     * Populates the dependencies for each task in the workflow based on the workflow definition.
     *
     * @param workflowDef - The workflow definition containing steps and their dependencies.
     * @param tasks - The array of tasks to update with dependency information.
     */
    private populateDependencies(workflowDef: WorkflowDefinition, tasks: Task[]) {
        workflowDef.steps
            .filter((step) => !!step.dependsOn)
            .forEach((step) => {
                const task = tasks.find((task) => task.stepNumber === step.stepNumber);
                task!.dependencies = tasks.filter((t) => step.dependsOn?.includes(t.stepNumber));
            });
    }

    /**
     * Parses a YAML workflow definition string into a `WorkflowDefinition` object.
     * Ensures that the `dependsOn` field in each step is always an array,
     * allowing for single or multiple step dependencies.
     *
     * @param fileContent - The YAML string representing the workflow definition.
     * @returns The parsed `WorkflowDefinition` object.
     */
    private parseWorkflowDefinition(fileContent: string): WorkflowDefinition {
        const workflowDef = yaml.load(fileContent) as any;

        // Cast dependsOn field to an array - this way the workflow definition can
        // conveniently include either a single step number or an array of step numbers.
        workflowDef.steps
            .filter((step: any) => !!step.dependsOn)
            .forEach((step: any) => {
                step.dependsOn = Array.isArray(step.dependsOn) ? step.dependsOn : [step.dependsOn];
            });
        return workflowDef;
    }


    /**
     * Validates the structure and integrity of a workflow definition.
     *
     * Checks that each step has a task type and a unique step number,
     * ensures steps do not depend on subsequent steps, and verifies
     * that all step numbers are unique.
     *
     * @param workflowDefinition - The workflow definition to validate.
     * @throws Error if any validation rule is violated.
     */
    private validateWorkflowDefinition(workflowDefinition: WorkflowDefinition): void {
        workflowDefinition.steps.forEach((step) => {
            if (!step.taskType) {
                throw new Error('Task type is required');
            }

            if (!step.stepNumber) {
                throw new Error('Step number is required');
            }

            if (step.dependsOn && step.dependsOn.some((stepNumber) => stepNumber >= step.stepNumber)) {
                throw new Error('Step can not depend on other steps that come after it');
            }
        });

        const stepNumbers = workflowDefinition.steps.map((step) => step.stepNumber);
        const uniqueStepNumbers = new Set(stepNumbers);
        if (uniqueStepNumbers.size !== stepNumbers.length) {
            throw new Error('Step numbers must be unique');
        }
    }
}
