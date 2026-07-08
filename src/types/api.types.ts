export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}
