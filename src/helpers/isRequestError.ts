/**
 * For some reason, an `instanceof` check doesn't work with Octokit's `RequestError`.
 * This typeguard provides similar functionality, since realistically all
 * we care about is `status`.
 */
export function isRequestError(
  error: Error,
): error is Error & { status: number } {
  return 'status' in error;
}
