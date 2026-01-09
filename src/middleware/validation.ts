import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AppError } from '../utils/AppError';

export async function validateDto<T extends object>(
  dtoClass: new () => T,
  body: unknown
): Promise<T> {
  const dtoInstance = plainToInstance(dtoClass, body);
  const errors = await validate(dtoInstance as object);

  if (errors.length > 0) {
    const formattedErrors = formatValidationErrors(errors);
    throw new AppError('Validation failed', 400, true, { errors: formattedErrors });
  }

  return dtoInstance;
}

function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  for (const error of errors) {
    const property = error.property;
    const constraints = error.constraints;

    if (constraints) {
      formattedErrors[property] = Object.values(constraints);
    }

    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatValidationErrors(error.children);
      for (const [key, value] of Object.entries(nestedErrors)) {
        formattedErrors[`${property}.${key}`] = value;
      }
    }
  }

  return formattedErrors;
}