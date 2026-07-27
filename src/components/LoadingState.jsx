/**
 * LoadingState.jsx
 * Shown while the AI request is in flight. Displays a spinner plus
 * skeleton placeholder cards so the layout doesn't jump when content arrives.
 */
export default function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-live="polite" aria-label="Generating study set">
      <div className="spinner" aria-hidden="true" />
      <p className="loading-text">Generating your study set…</p>
      <p className="loading-subtext" style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--text-sm)' }}>
        This usually takes 5–15 seconds
      </p>

      {/* Skeleton preview cards */}
      <div className="skeleton-group" aria-hidden="true" style={{ width: '100%', maxWidth: '600px' }}>
        <div className="skeleton skeleton-card" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line short" />
        </div>
        <div className="skeleton skeleton-card" style={{ height: '80px' }} />
        <div className="skeleton skeleton-line medium" />
      </div>
    </div>
  );
}
