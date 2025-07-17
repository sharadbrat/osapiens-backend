/**
 * Express router for handling analysis-related endpoints.
 *
 * @module analysisRoutes
 *
 * @remarks
 * This router provides an endpoint to create workflows from YAML definitions.
 * It validates the request body using Joi and a custom validation middleware.
 *
 * @example
 * POST /analysis
 * {
 *   "clientId": "client-123",
 *   "input": { ... },
 *   "workflowName": "exampleWorkflow"
 * }
 *
 * @see {@link WorkflowFactory}
 * @see {@link Validation}
 * @see {@link Logger}
 * @see {@link HttpStatus}
 */
import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { WorkflowFactory } from '../workflows/WorkflowFactory'; // Create a folder for factories if you prefer
import path from 'path';
import { Logger } from '../utils/logger';
import { HttpStatus } from '../utils/httpStatus';
import Joi from 'joi';
import { Validation } from '../middlewares/validation';

const router = Router();
const workflowFactory = new WorkflowFactory(AppDataSource);
const logger = Logger.withPrefix('AnalysisRouter');

const analysisBodySchema = Joi.object({
    clientId: Joi.string().required(),
    input: Joi.object().required(),
    workflowName: Joi.string().required(),
});

router.post('/', Validation.body(analysisBodySchema), async (req, res) => {
    const { clientId, input, workflowName } = req.body;
    const workflowFile = path.join(__dirname, `../workflows/${workflowName}.yml`);

    try {
        const workflow = await workflowFactory.createWorkflowFromYAML(workflowFile, clientId, input);

        res.status(HttpStatus.Accepted).json({
            workflowId: workflow.workflowId,
            message: 'Workflow created and tasks queued from YAML definition.',
        });
    } catch (error: any) {
        logger.error('Error creating workflow:', error);
        res.status(HttpStatus.InternalServerError).json({ message: 'Failed to create workflow' });
    }
});

export default router;
