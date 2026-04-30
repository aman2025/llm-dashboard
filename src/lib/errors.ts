export class AppError extends Error {
  constructor(
    public code: "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "INTERNAL_ERROR",
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getHttpStatus(code: AppError["code"]): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION_ERROR":
      return 400;
    case "CONFLICT":
      return 409;
    case "INTERNAL_ERROR":
      return 500;
  }
}