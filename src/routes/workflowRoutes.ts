/**
 * Express router for workflow-related endpoints.
 *
 * @module workflowRoutes
 *
 * @remarks
 * This router provides endpoints to:
 * - Get the status of a workflow (`GET /:id/status`)
 * - Get the results of a completed workflow (`GET /:id/results`)
 *
 * @see {@link Workflow}
 * @see {@link WorkflowStatus}
 * @see {@link TaskStatus}
 *
 * @example
 * // Get workflow status
 * GET /workflow/123/status
 *
 * // Get workflow results
 * GET /workflow/123/results
 */
import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Logger } from '../utils/logger';
import { Workflow } from '../models/Workflow';
import { HttpStatus } from '../utils/httpStatus';
import { TaskStatus } from '../workers/taskRunner';
import { WorkflowStatus } from '../workflows/WorkflowFactory';
import { take } from '../utils/take';
import { Validation } from '../middlewares/validation';
import Joi from 'joi';

const router = Router();
const workflowRepository = AppDataSource.getRepository(Workflow);
const logger = Logger.withPrefix('WorkflowRouter');

const workflowStatusParamsSchema = Joi.object({
    id: Joi.string().required(),
});

router.get('/:id/status', Validation.params(workflowStatusParamsSchema), async (req, res) => {
    try {
        const workflowId = req.params.id;
        const workflow = await workflowRepository.findOne({ where: { workflowId } });
        if (!workflow) {
            res.status(HttpStatus.NotFound).json({ message: 'Workflow not found' });
            return;
        }

        res.status(HttpStatus.Ok).json({
            workflowId: workflow.workflowId,
            status: workflow.status,
            completedTasks: workflow.tasks.filter((task) => task.isCompleted).length,
            totalTasks: workflow.tasks.length,
        });
    } catch (error: any) {
        logger.error('Error getting workflow status:', error);
        res.status(HttpStatus.InternalServerError).json({ message: 'Failed to get workflow status' });
    }
});

const workflowResultsParamsSchema = Joi.object({
    id: Joi.string().required(),
});

router.get('/:id/results', Validation.params(workflowResultsParamsSchema), async (req, res) => {
    try {
        const workflowId = req.params.id;
        const workflow = await workflowRepository.findOne({ where: { workflowId } });
        if (!workflow) {
            res.status(HttpStatus.NotFound).json({ message: 'Workflow not found' });
            return;
        }

        if (!workflow.isCompleted) {
            res.status(HttpStatus.BadRequest).json({ message: 'Workflow is not completed yet' });
            return;
        }

        res.status(HttpStatus.Ok).json(take(workflow, ['workflowId', 'status', 'finalResult']));
    } catch (error: any) {
        logger.error('Error getting workflow results:', error);
        res.status(HttpStatus.InternalServerError).json({ message: 'Failed to get workflow results' });
    }
});

export default router;
