/**
 * api.js
 * Thin wrapper around fetch('/api/generate') with:
 *  - AbortController for stale-response prevention AND client-side timeout
 *  - 20-second timeout before showing a user-friendly error
 *  - Returns { data } on success or { error: string } on any failure
 *
 * The AbortController is returned so the caller (App.jsx) can abort
 * any in-flight request when the user submits a new one, preventing a
 * late-arriving response from overwriting newer UI state.
 */

const API_TIMEOUT_MS = 20_000; // 20 seconds client-side timeout

/**
 * Calls the backend /api/generate endpoint.
 *
 * @param {string} text   The user's notes or topic text
 * @param {AbortSignal} signal  AbortSignal from the caller's AbortController
 * @returns {Promise<{ data?: object, error?: string }>}
 */
export async function generateStudySet(text, signal) {
  let timeoutId;

  // We create a combined abort: the caller's signal OR our internal timeout
  const timeoutController = new AbortController();
  timeoutId = setTimeout(() => {
    timeoutController.abort('timeout');
  }, API_TIMEOUT_MS);

  // Fast-path: if the caller already aborted (new request started before this
  // one even began), return immediately without touching the network.
  if (signal?.aborted) {
    clearTimeout(timeoutId);
    return { error: 'cancelled', isCancelled: true };
  }

  // Merge two signals: if either fires, the fetch is aborted.
  // Use an intermediate listener to propagate the caller's signal into ours.
  const onCallerAbort = () => timeoutController.abort('caller_abort');
  signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: timeoutController.signal,
    });

    // Distinguish timeout from caller-initiated abort
    // (both arrive as AbortError, but we check the reason)
    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errBody = await response.json();
        if (errBody?.error) errorMsg = errBody.error;
      } catch {
        // ignore parse failure on error body
      }
      return { error: errorMsg };
    }

    const data = await response.json();
    return { data };

  } catch (err) {
    if (err.name === 'AbortError') {
      // Distinguish between our timeout abort vs. the caller's stale-cancel abort
      if (timeoutController.signal.reason === 'timeout') {
        return {
          error: 'Request timed out after 20 seconds. The AI may be busy — please try again.',
          isTimeout: true,
        };
      }
      // Caller aborted intentionally (new request started); caller handles this
      return { error: 'cancelled', isCancelled: true };
    }
    // Network failure or other unexpected error
    return { error: `Network error: ${err.message || 'unknown error'}` };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}
