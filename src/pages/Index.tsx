const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="text-muted-foreground">Home page loaded successfully.</p>
        <nav className="space-x-4">
          <a className="underline" href="/dashboard">Dashboard</a>
          <a className="underline" href="/live-market">Live Market</a>
          <a className="underline" href="/auth">Sign in</a>
        </nav>
      </div>
    </main>
  );
};

export default Index;
