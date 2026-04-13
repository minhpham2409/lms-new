import { ApiResponse, PaginatedResponse } from '../interfaces';

export class ResponseUtil {
  /**
   * Create success response
   */
  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Create error response
   */
  static error(error: string, message?: string): ApiResponse {
    return {
      success: false,
      message,
      error,
    };
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
