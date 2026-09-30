export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type HealthResponse = {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  timestamp: string;
};

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`);
  const body = await res.json();
  if (!res.ok) throw new Error(`Server reported ${body.status ?? res.status}`);
  return body;
}