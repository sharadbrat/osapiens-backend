import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Workflow } from './Workflow';
import { TaskStatus } from '../workers/taskRunner';
import { Result } from './Result';

@Entity({ name: 'tasks' })
export class Task {
    @PrimaryGeneratedColumn('uuid')
    taskId!: string;

    @Column()
    clientId!: string;

    @Column()
    status!: TaskStatus;

    @Column()
    workflowId!: string;

    @Column({ nullable: true, type: 'text' })
    progress?: string | null;

    @Column()
    taskType!: string;

    @Column({ default: 1 })
    stepNumber!: number;

    @OneToOne(() => Result, (result) => result.task, { nullable: true })
    result!: Result;

    @ManyToOne(() => Workflow, (workflow) => workflow.tasks)
    workflow!: Workflow;

    @ManyToOne(() => Task, (task) => task.dependencies, { nullable: true })
    dependant?: Task;

    @OneToMany(() => Task, (task) => task.dependant, { nullable: true })
    dependencies?: Task[];

    public get isCompleted(): boolean {
        return [TaskStatus.Completed, TaskStatus.Failed, TaskStatus.Skipped].includes(this.status);
    }
}
