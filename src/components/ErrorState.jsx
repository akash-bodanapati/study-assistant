/**
 * ErrorState.jsx
 * Shown when the AI response fails (network error, malformed JSON,
 * timeout, or validation failure). Always provides a Retry button and
 * a human-readable error message — never a raw crash.
 *
 * Props:
 *   error    {string}   Human-readable error description
 *   onRetry  {function} Called when the user clicks Retry
 *   isTimeout {boolean}  True if this was a client-side timeout
 */
export default function ErrorState({ error, onRetry, isTimeout = false }) {
  const icon = isTimeout ? '⏱️' : '⚠️';
  const title = isTimeout ? 'Request Timed Out' : 'Something went wrong';

  return (
    <div className="error-state" role="alert" aria-live="assertive">
      <div className="error-icon" aria-hidden="true">{icon}</div>
      <h2 className="error-title">{title}</h2>
      <p className="error-message">{error}</p>

      <div className="error-actions">
        <button
          id="retry-btn"
          className="btn btn-primary"
          onClick={onRetry}
          aria-label="Retry request"
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
}
