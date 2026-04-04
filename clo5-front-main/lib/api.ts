const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function getApiBaseUrl() {
  const browserUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const serverUrl =
    typeof window === "undefined" && process.env.API_URL_INTERNAL
      ? process.env.API_URL_INTERNAL
      : browserUrl;

  return stripTrailingSlash(serverUrl);
}
