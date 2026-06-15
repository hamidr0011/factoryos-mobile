import { supabase } from "./supabase";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export const isApiConfigured = Boolean(apiUrl && !apiUrl.includes("your-factoryos-api"));

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  if (!isApiConfigured || !apiUrl) {
    throw new Error("FactoryOS API is not configured.");
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("You must be signed in to use the FactoryOS API.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `FactoryOS API request failed with ${response.status}.`);
  }

  return payload.data ?? payload;
};
