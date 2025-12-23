import { NextResponse } from "next/server";

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
};

const createResponse = <T>(data: ApiResponse<T>, status: number) => {
  return NextResponse.json(data, { status });
};

export const apiResponse = {
  success: <T>(data: T, status = 200) => {
    return createResponse<T>(
      {
        success: true,
        data,
      },
      status,
    );
  },

  error: (message: string, status = 400) => {
    return createResponse(
      {
        success: false,
        error: message,
      },
      status,
    );
  },

  serverError: (message = "Internal Server Error") => {
    return apiResponse.error(message, 500);
  },

  unauthorized: (message = "User not authenticated") => {
    return apiResponse.error(message, 401);
  },

  badRequest: (message = "Bad Request") => {
    return apiResponse.error(message, 400);
  },

  forbidden: (message = "Forbidden") => {
    return apiResponse.error(message, 403);
  },

  notFound: (message = "Not Found") => {
    return apiResponse.error(message, 404);
  },

  conflict: (message = "Conflict") => {
    return apiResponse.error(message, 409);
  },
};
