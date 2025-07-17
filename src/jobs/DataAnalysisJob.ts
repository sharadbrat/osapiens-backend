import { Job } from './Job';
import { Task } from '../models/Task';
import booleanWithin from '@turf/boolean-within';
import { Feature, Polygon } from 'geojson';
import countryMapping from '../data/world_data.json';
import { Logger } from '../utils/logger';
import { JobContext } from './JobContext';

export class DataAnalysisJob implements Job<string> {
    private readonly logger: Logger = Logger.withPrefix('DataAnalysisJob');

    async run(task: Task, context: JobContext): Promise<string> {
        this.logger.log(`Running data analysis for task ${task.taskId}...`);

        const inputGeometry: Feature<Polygon> = context.input?.geoJson;

        if (!inputGeometry) {
            throw new Error('No input geometry provided in context');
        }

        for (const countryFeature of countryMapping.features) {
            if (countryFeature.geometry.type === 'Polygon' || countryFeature.geometry.type === 'MultiPolygon') {
                const isWithin = booleanWithin(inputGeometry, countryFeature as Feature<Polygon>);
                if (isWithin) {
                    this.logger.log(`The polygon is within ${countryFeature.properties?.name}`);
                    return countryFeature.properties?.name;
                }
            }
        }

        throw new Error('No country found');
    }
}
