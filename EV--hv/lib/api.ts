export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}