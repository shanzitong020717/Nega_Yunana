type BuildProviderRealtimeWebSocketURLInput = {
  baseURL: string;
  model: string;
  providerWebSocketURL?: string;
};

export function buildProviderRealtimeWebSocketURL({
  baseURL,
  model,
  providerWebSocketURL,
}: BuildProviderRealtimeWebSocketURLInput) {
  const explicitWebSocketURL = providerWebSocketURL?.trim();

  if (explicitWebSocketURL) {
    return explicitWebSocketURL;
  }

  const url = new URL(baseURL.trim());
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/realtime`;
  url.search = "";
  url.searchParams.set("model", model);

  return url.toString();
}
