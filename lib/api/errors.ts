export class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const assertFound = <T>(value: T | null, message = "Not found"): T => {
  if (!value) {
    throw new ApiError(404, message);
  }
  return value;
};
