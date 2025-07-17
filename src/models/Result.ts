import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Task } from './Task';

@Entity({ name: 'results' })
export class Result {
    @PrimaryGeneratedColumn('uuid')
    resultId!: string;

    @OneToOne(() => Task, (task) => task.result)
    @JoinColumn()
    task!: Task;

    @Column({ nullable: true, type: 'text' })
    data!: string | null; // Could be JSON or any serialized format

    @Column({ nullable: true, type: 'text' })
    error!: string | null; // Could be JSON or any serialized format
}
