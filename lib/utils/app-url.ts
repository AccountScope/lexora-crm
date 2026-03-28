let cachedBaseUrl: string | null = null;

export const getAppBaseUrl = () => {
  if (cachedBaseUrl) return cachedBaseUrl;
  const envValue = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (envValue) {
    cachedBaseUrl = envValue.replace(/\/$/, "");
    return cachedBaseUrl;
  }
  if (process.env.VERCEL_URL) {
    cachedBaseUrl = `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
    return cachedBaseUrl;
  }
  cachedBaseUrl = "http://localhost:3000";
  return cachedBaseUrl;
};
