import { Task } from '../models/Task';
import { JobContext } from './JobContext';

export interface Job<T> {
    run(task: Task, context: JobContext): Promise<T>;
}
