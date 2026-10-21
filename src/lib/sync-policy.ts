export function retryDelayMs(attempts: number) {
  const normalized = Math.max(0, Math.floor(attempts));
  return Math.min(60_000, 1_000 * 2 ** normalized);
}

export function shouldRetry(status: number | null) {
  return status === null || status === 408 || status === 425 || status === 429 || status >= 500;
}
