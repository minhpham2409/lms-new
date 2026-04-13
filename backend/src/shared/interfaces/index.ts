export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
