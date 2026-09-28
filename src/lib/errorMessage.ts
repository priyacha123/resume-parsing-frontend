import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.file?.[0] === 'string') return data.file[0];
    if (typeof data?.raw_text?.[0] === 'string') return data.raw_text[0];
  }
  return fallback;
}
