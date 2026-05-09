// app/loading.tsx — Fix #3b: App-wide loading skeleton; gives instant FCP feedback during navigation.
export default function Loading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-spin" aria-hidden="true">🕉️</div>
        <p className="text-text-light" role="status" aria-live="polite">
          Loading…
        </p>
      </div>
    </div>
  );
}
