const base = process.env.CONTROL_API_URL ?? process.env.NEXT_PUBLIC_CONTROL_API_URL ?? 'http://localhost:3001';

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export async function api<T = unknown>(path: string, init?: NextFetchInit): Promise<T> {
  const response = await fetch(`${base}${path}`, init ?? { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}
