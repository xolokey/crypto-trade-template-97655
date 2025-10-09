const SafeIndex = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>App Loaded</h1>
      <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Minimal shell rendered successfully.</p>
      <a href="/dashboard" style={{ textDecoration: 'underline' }}>Go to Dashboard</a>
    </div>
  </div>
);

export default SafeIndex;
