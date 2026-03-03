export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function success<T>(data: T, pagination?: ApiResponse['pagination']): ApiResponse<T> {
  return { success: true, data, pagination };
}

export function error(message: string): ApiResponse {
  return { success: false, error: message };
}

export function paginated<T>(data: T, total: number, page: number, limit: number): ApiResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
