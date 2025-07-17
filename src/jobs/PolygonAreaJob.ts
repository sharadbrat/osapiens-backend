import { Job } from './Job';
import { Task } from '../models/Task';
import { Feature, Polygon } from 'geojson';
import area from '@turf/area';
import booleanValid from '@turf/boolean-valid';
import { Logger } from '../utils/logger';
import { JobContext } from './JobContext';

export class PolygonAreaJob implements Job<number> {
    private readonly logger: Logger = Logger.withPrefix('PolygonAreaJob');

    public async run(task: Task, context: JobContext): Promise<number> {
        this.logger.log(`Running polygon area for task ${task.taskId}...`);

        const inputGeometry: Feature<Polygon> = context.input?.geoJson;

        if (!inputGeometry) {
            throw new Error('No input geometry provided in context');
        }

        if (!booleanValid(inputGeometry)) {
            throw new Error('Cannot calculate area: Invalid geometry');
        }

        return area(inputGeometry);
    }
}
