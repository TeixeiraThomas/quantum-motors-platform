const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "/api");
  }

  return stripTrailingSlash(
    process.env.API_URL_INTERNAL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000"
  );
}
