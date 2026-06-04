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
