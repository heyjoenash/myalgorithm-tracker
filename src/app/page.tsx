export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🚀 MyAlgorithm Platform
        </h1>
        <p className="text-center text-lg text-muted-foreground">
          Control your feed. Build your own algorithm in 60 seconds.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/tracker/build"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
          >
            Build Your First Tracker
          </a>
          <a
            href="/dashboard"
            className="rounded-lg border px-6 py-3 hover:bg-accent transition"
          >
            View Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
