export interface RequestState<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
}

export function initialRequestState<TData>(): RequestState<TData> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
