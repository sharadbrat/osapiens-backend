import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { HttpStatus } from '../utils/httpStatus';

/**
 * A utility class for validating request bodies and parameters using Joi schemas.
 */
export class Validation {
    /**
     * Middleware to validate the request body against a Joi schema.
     *
     * @param schema - Joi schema to validate the request body.
     * @returns Express middleware function that validates `req.body`.
     * If validation fails, responds with HTTP 400 and error message.
     */
    public static body(schema: Joi.Schema): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(HttpStatus.BadRequest).json({ error: error.details[0].message });
            }
            next();
        };
    }

    /**
     * Middleware to validate the request parameters against a Joi schema.
     *
     * @param schema - Joi schema to validate the request parameters.
     * @returns Express middleware function that validates `req.params`.
     * If validation fails, responds with HTTP 400 and error message.
     */
    public static params(schema: Joi.Schema): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const { error } = schema.validate(req.params);
            if (error) {
                return res.status(HttpStatus.BadRequest).json({ error: error.details[0].message });
            }
            next();
        };
    }
}
