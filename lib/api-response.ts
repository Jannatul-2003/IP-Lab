import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  status: number;
  details?: Record<string, any>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

export function errorResponse(
  error: string | ApiError,
  details?: Record<string, any>
): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error.details && { details: error.details }),
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status: 400 }
  );
}

export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return errorResponse(error);
  }

  if (error instanceof SyntaxError) {
    return errorResponse('Invalid JSON payload', { error: error.message });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  );
}
