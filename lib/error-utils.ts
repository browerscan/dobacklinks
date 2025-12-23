export function getErrorMessage(error: unknown): string {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    message = (error as any).message;
  } else if (typeof error === "string") {
    message = error;
  } else if (
    error &&
    typeof error === "object" &&
    "details" in error &&
    typeof (error as any).details === "string"
  ) {
    message = (error as any).details;
  } else {
    try {
      message = JSON.stringify(error);
    } catch {
      message = "An unknown error occurred.";
    }
  }
  return message;
}
