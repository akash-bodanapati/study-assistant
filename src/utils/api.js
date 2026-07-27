/**
 * api.js
 * Thin wrapper around fetch('/api/generate') with:
 *  - AbortController for stale-response prevention AND client-side timeout
 *  - 20-second timeout before showing a user-friendly error
 *  - Returns { data } on success or { error: string, isTimeout?: boolean, isCancelled?: boolean } on failure
 *
 * The caller (App.jsx) passes an AbortSignal. When the user submits a new request,
 * the caller aborts the previous signal so a late-arriving response is discarded silently.
 */

const API_TIMEOUT_MS = 20_000; // 20 seconds client-side timeout

/**
 * Calls the backend /api/generate endpoint.
 *
 * @param {string} text   The user's notes or topic text
 * @param {AbortSignal} [signal]  AbortSignal from the caller's AbortController
 * @returns {Promise<{ data?: object, error?: string, isTimeout?: boolean, isCancelled?: boolean }>}
 */
export async function generateStudySet(text, signal) {
  let timeoutId;

  // Internal controller for the 20-second client-side timeout
  const timeoutController = new AbortController();
  timeoutId = setTimeout(() => {
    timeoutController.abort('timeout');
  }, API_TIMEOUT_MS);

  // Fast-path: if caller's signal is already aborted (new request started before this
  // fetch call even began), return immediately with isCancelled: true.
  if (signal?.aborted) {
    clearTimeout(timeoutId);
    return { error: 'cancelled', isCancelled: true };
  }

  // Propagate caller's abort signal to our timeoutController with reason 'caller_abort'
  const onCallerAbort = () => timeoutController.abort('caller_abort');
  signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: timeoutController.signal,
    });

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
    // 1. Stale-response cancellation check:
    // If the caller aborted (user submitted a new request), drop it silently.
    const isCallerAborted =
      signal?.aborted ||
      timeoutController.signal.reason === 'caller_abort' ||
      err === 'caller_abort' ||
      err?.message === 'caller_abort';

    if (isCallerAborted) {
      return { error: 'cancelled', isCancelled: true };
    }

    // 2. Timeout check:
    // If our 20s timeout controller triggered, return the timeout-specific error.
    const isTimeout =
      timeoutController.signal.aborted ||
      timeoutController.signal.reason === 'timeout' ||
      err === 'timeout' ||
      err?.name === 'AbortError' ||
      (err?.message && String(err.message).toLowerCase().includes('abort'));

    if (isTimeout) {
      return {
        error: 'Request timed out after 20 seconds. The AI may be busy — please try again.',
        isTimeout: true,
      };
    }

    // 3. Generic network failure or unhandled exception
    return { error: `Network error: ${err?.message || 'unknown error'}` };

  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}
