import { SetupWizard } from "./SetupWizard";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/30 px-4 py-2 text-xs font-semibold tracking-wide text-[color:var(--foreground)] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              New: download a ready-to-run zip in 1 minute
            </div>

            <h1 className="text-balance text-5xl leading-none tracking-tight text-[color:var(--foreground)] sm:text-6xl">
              <span className="[font-family:var(--font-display)]">Automated Raffle Bot</span>{" "}
              <span className="text-[color:var(--muted)]">by BigFloppa</span>
            </h1>

            <p className="max-w-xl text-pretty text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              ARB is a Telegram‑controlled browser bot that helps you enter Discord raffles faster.
              Paste your channel links, download a configured folder, run it locally — done.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#download"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Get the bot zip
              </a>
              <a
                href="#what"
                className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/25 px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-sm backdrop-blur hover:bg-white/35"
              >
                What is ARB?
              </a>
            </div>

            <div className="rounded-2xl border border-white/40 bg-white/25 p-4 shadow-sm backdrop-blur">
              <div className="text-xs font-semibold tracking-wide text-[color:var(--muted)]">
                Looks like this
              </div>
              <pre className="mt-2 overflow-auto rounded-xl bg-zinc-950/90 p-4 text-xs leading-6 text-zinc-100">
{`$ python -m venv venv
$ venv\\Scripts\\activate
$ pip install -r requirements.txt
$ python -m playwright install chromium
$ python telegram_runner.py
# /start  → run
# /stats  → results`}
              </pre>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-white/20 blur-2xl" />
            <img
              src="/hero.svg"
              alt="Terminal-style preview"
              className="relative w-full rounded-3xl border border-white/40 shadow-lg"
            />
          </div>
        </div>

        {/* scroll hint */}
        <div className="mt-10 flex justify-center">
          <a
            href="#what"
            className="group inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/25 px-4 py-2 text-xs font-semibold text-[color:var(--foreground)] shadow-sm backdrop-blur hover:bg-white/35"
          >
            Scroll
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:translate-y-0.5"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M12 19l6-6M12 19l-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </section>

      {/* WHAT */}
      <section id="what" className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-[color:var(--foreground)]">
              <span className="font-extrabold">What ARB is</span>
            </h2>
            <p className="text-base leading-7 text-[color:var(--muted)]">
              ARB is built for people who don’t want to babysit raffle channels all day. You give it
              your Discord channel links, it opens a real browser, scans for <strong>ENTER RAFFLE</strong>{" "}
              buttons, and clicks them with human‑like pacing.
            </p>
            <ul className="space-y-2 text-sm text-[color:var(--muted)]">
              <li>
                <strong className="text-[color:var(--foreground)]">Save time:</strong> stop
                refreshing channels, let the bot do the boring part.
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">Control from Telegram:</strong>{" "}
                start/stop and get stats in chat.
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">Runs on your PC:</strong> your
                Discord session stays local.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/40 bg-white/25 p-5 shadow-sm backdrop-blur">
            <div className="text-xs font-semibold tracking-wide text-[color:var(--muted)]">
              Example flow
            </div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-2xl bg-white/45 p-4">
                <div className="text-sm font-semibold text-[color:var(--foreground)]">
                  Bottom → top scanning
                </div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  Starts at newest messages and works upward until it hits ended raffles.
                </div>
              </div>
              <div className="rounded-2xl bg-white/45 p-4">
                <div className="text-sm font-semibold text-[color:var(--foreground)]">Stats</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  Writes a summary JSON and Telegram can show per‑channel results.
                </div>
              </div>
              <div className="rounded-2xl bg-white/45 p-4">
                <div className="text-sm font-semibold text-[color:var(--foreground)]">
                  Human‑like delays
                </div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  Random timing between clicks and between channels.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUIDE */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-[color:var(--foreground)]">
              Setup guide (no code)
            </h2>
            <p className="text-base leading-7 text-[color:var(--muted)]">
              The fastest way is the wizard below. It generates everything you need and keeps your
              secrets local — you can leave Telegram fields empty and fill{" "}
              <code className="rounded bg-white/50 px-1">.env</code> yourself after unzip.
            </p>

            <ol className="space-y-2 text-sm text-[color:var(--muted)]">
              <li>
                <strong className="text-[color:var(--foreground)]">1.</strong> Fill channels (one per
                line).
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">2.</strong> Download and unzip.
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">3.</strong> Run{" "}
                <code className="rounded bg-white/50 px-1">setup_windows.bat</code> (optional, but
                recommended).
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">4.</strong> Start{" "}
                <code className="rounded bg-white/50 px-1">start_telegram_bot.bat</code> and send{" "}
                <code className="rounded bg-white/50 px-1">/start</code>.
              </li>
            </ol>

            <div className="rounded-2xl border border-white/40 bg-white/25 p-4 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                How to find your Telegram user id
              </div>
              <div className="mt-1 text-sm text-[color:var(--muted)]">
                Message <code className="rounded bg-white/50 px-1">@userinfobot</code> in Telegram —
                it replies with your numeric id.
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="/steps.svg"
              alt="Setup steps"
              className="w-full rounded-3xl border border-white/40 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="download" className="mx-auto max-w-6xl px-6 pb-20 pt-6">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-[color:var(--foreground)]">Download generator</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Fill, solve CAPTCHA, download a configured zip.
            </p>
          </div>
        </div>

        <SetupWizard />
      </section>
    </main>
  );
}
