export function shouldBypassAuthForE2E() {
  return process.env.PLAYWRIGHT_AUTH_BYPASS === "1";
}
