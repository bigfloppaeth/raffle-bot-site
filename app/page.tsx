import { SetupWizard } from "./SetupWizard";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-12 font-sans text-zinc-900 dark:text-zinc-100">
      <header className="space-y-3">
        <p className="text-sm font-medium text-emerald-600">Guide</p>
        <h1 className="text-4xl font-bold leading-tight">Discord Raffle Bot (Telegram-controlled)</h1>
        <p className="max-w-3xl text-lg text-zinc-700">
          A browser automation bot that enters Discord raffles and can be controlled from Telegram.
        </p>
      </header>

      <SetupWizard />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Start</h2>
        <ol className="list-decimal space-y-2 pl-6 text-base leading-7 text-zinc-800">
          <li>Install Python and create a virtual environment.</li>
          <li>Install dependencies: <code className="rounded bg-zinc-100 px-2 py-1 text-sm">pip install -r requirements.txt</code></li>
          <li>Install Playwright Chromium: <code className="rounded bg-zinc-100 px-2 py-1 text-sm">playwright install chromium</code></li>
          <li>Create <code className="rounded bg-zinc-100 px-2 py-1 text-sm">.env</code> and add your Discord + Telegram variables.</li>
          <li>Fill <code className="rounded bg-zinc-100 px-2 py-1 text-sm">config.json</code> with your Discord channel URLs.</li>
          <li>Run the raffle bot: <code className="rounded bg-zinc-100 px-2 py-1 text-sm">python -m src.main</code></li>
          <li>Run the Telegram controller: <code className="rounded bg-zinc-100 px-2 py-1 text-sm">python telegram_runner.py</code></li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Telegram Setup</h2>
        <ol className="list-decimal space-y-3 pl-6 text-base leading-7 text-zinc-800">
          <li>Create a bot with BotFather and copy the token.</li>
          <li>Find your Telegram numeric user id (for example using <code className="rounded bg-zinc-100 px-2 py-1 text-sm">@userinfobot</code>).</li>
          <li>
            Add to your <code className="rounded bg-zinc-100 px-2 py-1 text-sm">.env</code>:
            <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-3 text-sm leading-6">
{`TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_ALLOWED_USER_ID=123456789`}
            </pre>
          </li>
          <li>Start the Telegram controller: <code className="rounded bg-zinc-100 px-2 py-1 text-sm">python telegram_runner.py</code></li>
          <li>In Telegram use: <code className="rounded bg-zinc-100 px-2 py-1 text-sm">/start</code>, <code className="rounded bg-zinc-100 px-2 py-1 text-sm">/stop_bot</code>, <code className="rounded bg-zinc-100 px-2 py-1 text-sm">/status</code>, <code className="rounded bg-zinc-100 px-2 py-1 text-sm">/stats</code></li>
          <li>When a run finishes, the bot sends “✅ Successfully registered raffles” plus stats.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Discord Raffle Config</h2>
        <p className="text-base leading-7 text-zinc-800">
          Edit <code className="rounded bg-zinc-100 px-2 py-1 text-sm">config.json</code> and add channels like:
        </p>
        <pre className="overflow-auto rounded bg-zinc-100 p-3 text-sm leading-6">
{`{
  "channels": [
    {
      "name": "Mintify - new-raffles",
      "url": "https://discord.com/channels/922262508247597077/1038563106386890853"
    }
  ],
  "raffle_button_selectors": ["button:has-text('Enter Raffle')"],
  "navigation": { "wait_for_page_load": 5000, "scroll_delay": 2000 }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Desktop Shortcut (Windows)</h2>
        <p className="text-base leading-7 text-zinc-800">
          Create <code className="rounded bg-zinc-100 px-2 py-1 text-sm">start_telegram_bot.bat</code> and double‑click it to launch the Telegram controller:
        </p>
        <pre className="overflow-auto rounded bg-zinc-100 p-3 text-sm leading-6">
{`@echo off
cd /d "C:\\Users\\User\\discord-raffle-bot"
call venv\\Scripts\\activate.bat
python telegram_runner.py
pause`}
        </pre>
        <p className="text-sm text-zinc-700">
          Keep that terminal open while you use Telegram commands.
        </p>
      </section>
    </main>
  );
}
