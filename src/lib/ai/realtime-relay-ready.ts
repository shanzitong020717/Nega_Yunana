type RelayReadyEventInput = {
  realtimeSessionId: string;
  model: string;
  provider: string;
  voiceName?: string;
};

export function buildRelayReadyEvent({
  realtimeSessionId,
  model,
  provider,
  voiceName,
}: RelayReadyEventInput) {
  return {
    type: "relay.ready",
    realtimeSessionId,
    model,
    provider,
    voiceName,
  };
}
