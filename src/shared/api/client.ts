import axios from 'axios';
export const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const apiClient = axios.create({ baseURL: apiUrl || import.meta.env.BASE_URL, withCredentials: true, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await apiClient.request<T>({ url: path, method: options.method || 'GET', data: options.body ? JSON.parse(String(options.body)) : undefined, signal: options.signal || undefined });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    if (axios.isAxiosError(error)) throw new Error(typeof error.response?.data?.message === 'string' ? error.response.data.message : error.response ? `No se pudo completar la operación (${error.response.status}).` : 'No se pudo conectar. Revisa la conexión e inténtalo de nuevo.', { cause: error });
    throw error;
  }
}
