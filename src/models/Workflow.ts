import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Task } from './Task';
import { WorkflowStatus } from '../workflows/WorkflowFactory';

@Entity({ name: 'workflows' })
export class Workflow {
    @PrimaryGeneratedColumn('uuid')
    workflowId!: string;

    @Column()
    clientId!: string;

    @Column({ default: WorkflowStatus.Initial })
    status!: WorkflowStatus;

    @Column({ type: 'text', nullable: true })
    finalResult!: string;

    @Column({ type: 'text' })
    input!: string;

    @OneToMany(() => Task, (task) => task.workflow, { eager: true })
    tasks!: Task[];

    public get isCompleted(): boolean {
        return [WorkflowStatus.Completed, WorkflowStatus.Failed].includes(this.status);
    }
}
