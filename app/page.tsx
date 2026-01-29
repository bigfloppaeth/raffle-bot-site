import { SetupWizard } from "./SetupWizard";

export default function Home() {
  return (
    <main className="grid-bg min-h-screen flex flex-col">
      <nav className="w-full py-6 px-8 flex justify-between items-center border-b border-gray-800 backdrop-blur-md sticky top-0 z-50 bg-black/30">
        <div className="text-2xl font-bold font-mono tracking-tighter text-white">
          <span className="text-neon">&lt;</span>RAFFLE_BOT<span className="text-neon">/&gt;</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-mono text-gray-400">
          <a href="#features" className="hover:text-neon transition">
            FEATURES
          </a>
          <a href="#wizard" className="hover:text-neon transition">
            DOWNLOAD
          </a>
          <a href="#security" className="hover:text-neon transition">
            SECURITY
          </a>
          <a href="#telegram" className="hover:text-neon transition">
            TELEGRAM
          </a>
          <a href="#guide" className="hover:text-neon transition">
            GUIDE
          </a>
        </div>
        <a
          href="https://github.com/bigfloppaeth/raffle-bot-site"
          className="bg-white text-black px-5 py-2 rounded font-bold hover:bg-neon hover:text-white transition duration-300"
        >
          GET ACCESS
        </a>
      </nav>

      <header className="container mx-auto px-6 py-24 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full -z-10" />

        <div className="inline-block px-3 py-1 mb-6 border border-gray-700 rounded-full bg-gray-900/50 backdrop-blur">
          <span className="text-neon text-xs font-mono font-bold tracking-widest uppercase">
            Now with Profit Tracking &amp; Mint Alerts
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Stop Clicking.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-accent">
            Start Winning.
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          The stealthy, Playwright-based tool by{" "}
          <span className="text-white font-semibold">BigFloppa</span> that farms raffles and{" "}
          <span className="text-white font-semibold">tracks your wins automatically</span>. Local
          only. Zero API bans.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <a
            href="#wizard"
            className="px-8 py-4 bg-neon text-black font-bold text-lg rounded hover:bg-white hover:scale-105 transition transform shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="px-8 py-4 border border-gray-700 text-gray-300 font-mono text-sm rounded hover:border-gray-500 transition"
          >
            View Features
          </a>
        </div>

        <div className="mt-16 mx-auto max-w-4xl bg-terminal rounded-lg border border-gray-800 p-4 text-left font-mono text-sm code-shadow relative group">
          <div className="flex gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="space-y-1 text-gray-300">
            <p className="text-gray-500"># Initializing stealth browser context...</p>
            <p>
              &gt; Target: <span className="text-discord">AlphaLab - giveaways</span>
            </p>
            <p>
              &gt; <span className="text-neon">SUCCESS: Raffle Entered.</span> (Delay: 7.2s)
            </p>
            <p className="text-blue-400 mt-2">&gt; /wins</p>
            <p>
              &gt; <span className="text-white font-bold">🎉 RECENT WINS DETECTED:</span>
            </p>
            <p className="pl-4 text-green-400">- Azuki Elementals (Ends in 2h)</p>
            <p className="pl-4 text-green-400">- DeGods S3 Allowlist (Minting NOW)</p>
            <p>
              &gt; Exporting <span className="text-purple-300">win_history.xlsx</span>...{" "}
              <span className="text-gray-500">Done.</span>
            </p>
            <p className="typing-effect text-gray-400">_</p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-gradient-to-br from-neon to-transparent opacity-10 rounded-full blur-xl" />
        </div>
      </header>

      <section id="features" className="py-20 bg-black/50 border-y border-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-16 text-center">Full-Stack Alpha Tool</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30 hover:border-neon/50 transition duration-300 group">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4 text-xl group-hover:text-neon transition">
                🤖
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Ghost Mode</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Real Chromium instance with randomized human delays. 100% Undetectable.
              </p>
            </div>

            <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30 hover:border-blue-500/50 transition duration-300 group">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4 text-xl group-hover:text-blue-400 transition">
                🧠
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Smart Scanning</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Skips dead raffles. Jumps to new messages. Optimized for speed and safety.
              </p>
            </div>

            <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30 hover:border-purple-500/50 transition duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-xl rounded-full" />
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4 text-xl group-hover:text-purple-400 transition">
                📊
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Auto-Ledger</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Use{" "}
                <code className="text-purple-400 bg-purple-900/30 px-1 rounded">
                  /wins
                </code>{" "}
                to list recent wins and{" "}
                <code className="text-purple-400 bg-purple-900/30 px-1 rounded">
                  /winsexcel
                </code>{" "}
                to get a detailed <b>Excel (.xlsx)</b> file of all your winnings.
              </p>
            </div>

            <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30 hover:border-yellow-500/50 transition duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-xl rounded-full" />
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4 text-xl group-hover:text-yellow-400 transition">
                🚨
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Mint Radar</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Never miss a mint. <span className="font-mono">/notis</span> and startup alerts warn
                you about mints within 2 days, so you don&apos;t lose the allocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="wizard" className="py-24 container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block text-accent font-mono text-sm mb-4">DOWNLOAD</div>
            <h2 className="text-4xl font-bold mb-3">Generate Your Ready-to-Run Bot</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Paste your Discord channel links, optionally add Telegram info, solve the CAPTCHA,
              and download a zip. Your bot runs on your PC.
            </p>
          </div>

          <SetupWizard />
        </div>
      </section>

      <section id="telegram" className="py-24 container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="inline-block text-accent font-mono text-sm mb-4">REMOTE CONTROL</div>
            <h2 className="text-4xl font-bold mb-6">Manage Operations from Telegram</h2>
            <p className="text-gray-400 mb-8 text-lg">
              Start, stop, and get status reports from your phone. The controller also sends stats
              when the run finishes.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center text-xs">
                  ✓
                </span>
                <span className="text-gray-300">One‑tap Start/Stop commands</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center text-xs">
                  ✓
                </span>
                <span className="text-gray-300">Stats in chat after a run</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center text-xs">
                  ✓
                </span>
                <span className="text-gray-300">Minimized browser mode</span>
              </li>
            </ul>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="bg-gray-800 p-4 rounded-3xl w-full max-w-sm mx-auto border-4 border-gray-700 shadow-2xl">
              <div className="bg-[#0e1621] rounded-2xl h-96 p-4 flex flex-col justify-end font-sans overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#0e1621] to-transparent z-10" />

                <div className="bg-[#182533] p-3 rounded-lg rounded-tl-none mb-3 max-w-[80%] self-start">
                  <p className="text-xs text-blue-400 mb-1">You</p>
                  <p className="text-sm text-white">/start</p>
                </div>

                <div className="bg-[#2b5278] p-3 rounded-lg rounded-tr-none mb-3 max-w-[90%] self-end">
                  <p className="text-xs text-white/50 mb-1">Raffle Bot</p>
                  <p className="text-sm text-white">✅ Bot started successfully.</p>
                  <p className="text-xs text-white/70 mt-1">Scanning channels...</p>
                </div>

                <div className="bg-[#2b5278] p-3 rounded-lg rounded-tr-none mb-2 max-w-[90%] self-end">
                  <p className="text-xs text-white/50 mb-1">Raffle Bot</p>
                  <p className="text-sm text-white font-mono text-xs">
                    📊 RUN STATS
                    <br />
                    ------------------
                    <br />
                    ✅ Raffles Entered: 12
                    <br />
                    ⏱ Time: 4m 32s
                    <br />
                    💰 Mintify: 3
                    <br />
                    💰 AlphaLab: 9
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* Command Center – secondary block, image left / text right */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 relative order-2 lg:order-1">
            <div className="bg-gray-800 p-4 rounded-[2.5rem] w-full max-w-sm mx-auto border-[6px] border-gray-700 shadow-2xl">
              <div className="bg-[#0e1621] rounded-[2rem] h-[450px] p-4 flex flex-col font-sans overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-16 bg-[#182533] z-10 flex items-center px-6 gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    RB
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Raffle Bot</p>
                    <p className="text-blue-400 text-xs">bot</p>
                  </div>
                </div>

                <div className="mt-16 flex flex-col gap-3 overflow-hidden">
                  <div className="self-end bg-[#2b5278] px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                    <p className="text-white text-sm">/wins</p>
                  </div>

                  <div className="self-start bg-[#182533] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%]">
                    <p className="text-xs text-gray-400 mb-1">Raffle Bot • Smart Scanner</p>
                    <p className="text-sm text-white">
                      🎉 Recent Wins Found
                      <br />
                      <span className="text-green-400">Azuki Elements WL — WON</span>
                      <br />
                      <span className="text-yellow-300">Ether Orcs WL — MINTING</span>
                    </p>
                  </div>

                  <div className="self-start bg-[#182533] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%]">
                    <p className="text-xs text-white/60 mb-1">XLS Export</p>
                    <p className="text-xs text-green-300 font-mono">win_history.xlsx • 12kb</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 order-1 lg:order-2">
            <div className="inline-block text-accent font-mono text-sm mb-4">COMMAND CENTER</div>
            <h2 className="text-4xl font-bold mb-6">Your Pocket Alpha Caller</h2>
            <p className="text-gray-400 mb-8 text-lg">
              Instantly list active wins, export Excel, or see mint alerts – all from Telegram while
              you&apos;re AFK.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-neon font-bold">
                  /
                </div>
                <div>
                  <h4 className="text-white font-bold">New: /wins + /winsexcel</h4>
                  <p className="text-gray-400 text-sm">
                    Use <span className="font-mono text-white">/wins</span> to view your latest
                    Alphabot wins, or <span className="font-mono text-white">/winsexcel</span> to
                    pull a full Excel ledger.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-yellow-500 font-bold">
                  !
                </div>
                <div>
                  <h4 className="text-white font-bold">Smart Notifications</h4>
                  <p className="text-gray-400 text-sm">
                    <span className="font-mono text-white">/notis</span> and startup alerts ping you
                    when mints are close, so you don&apos;t miss your allocation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="guide" className="py-20 bg-black/50 border-y border-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4 text-center">Quick Guide</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-center">
            1) Fill the wizard → 2) Download zip → 3) Unzip → 4) Run setup (optional) → 5) Start
            Telegram controller → 6) Send <span className="font-mono text-white">/start</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="flex gap-4 p-6 bg-black rounded-lg border border-gray-800">
              <div className="text-neon text-xl">1</div>
              <div>
                <h4 className="font-bold text-white mb-2">Find your Telegram user id (optional)</h4>
                <p className="text-sm text-gray-400">
                  Message <span className="font-mono text-white">@userinfobot</span> and copy the
                  numeric id.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-black rounded-lg border border-gray-800">
              <div className="text-neon text-xl">2</div>
              <div>
                <h4 className="font-bold text-white mb-2">Create a Telegram bot (optional)</h4>
                <p className="text-sm text-gray-400">
                  Use BotFather → create bot → copy token. You can also leave it blank and fill{" "}
                  <span className="font-mono text-white">.env</span> after unzip.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-black rounded-lg border border-gray-800">
              <div className="text-neon text-xl">3</div>
              <div>
                <h4 className="font-bold text-white mb-2">Windows setup</h4>
                <p className="text-sm text-gray-400">
                  If included, run <span className="font-mono text-white">setup_windows.bat</span>{" "}
                  once (creates venv, installs deps, installs Chromium).
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-black rounded-lg border border-gray-800">
              <div className="text-neon text-xl">4</div>
              <div>
                <h4 className="font-bold text-white mb-2">Run and control</h4>
                <p className="text-sm text-gray-400">
                  Start <span className="font-mono text-white">start_telegram_bot.bat</span> and use{" "}
                  <span className="font-mono text-white">/start</span>,{" "}
                  <span className="font-mono text-white">/stop_bot</span>,{" "}
                  <span className="font-mono text-white">/stats</span>,{" "}
                  <span className="font-mono text-white">/wins</span>,{" "}
                  <span className="font-mono text-white">/winsexcel</span>,{" "}
                  <span className="font-mono text-white">/notis</span>.
                </p>
              </div>
            </div>
            <div
              id="ab-token-guide"
              className="flex gap-4 p-6 bg-black rounded-lg border border-gray-800 md:col-span-2"
            >
              <div className="text-neon text-xl">5</div>
              <div>
                <h4 className="font-bold text-white mb-2">Add Alphabot token (optional)</h4>
                <p className="text-sm text-gray-400">
                  In your browser, open Alphabot and log in. Then open DevTools →{" "}
                  <span className="font-mono text-white">Application</span> →{" "}
                  <span className="font-mono text-white">Cookies</span> and copy the value of{" "}
                  <span className="font-mono text-white">__Secure-next-auth.session-token</span> into{" "}
                  <span className="font-mono text-white">ALPHABOT_SESSION_TOKEN</span> in{" "}
                  <span className="font-mono text-white">.env</span>. This unlocks{" "}
                  <span className="font-mono text-white">/wins</span>,{" "}
                  <span className="font-mono text-white">/winsexcel</span>, and{" "}
                  <span className="font-mono text-white">/notis</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="py-20 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Your Data. Your Control.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            The bot runs locally on your machine. The website only generates a zip and uses CAPTCHA
            + rate limiting to prevent abuse.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="flex gap-4 p-6 bg-black rounded-lg border border-gray-800">
              <div className="text-green-500 text-xl">🔒</div>
              <div>
                <h4 className="font-bold text-white mb-2">Local Execution</h4>
                <p className="text-sm text-gray-400">
                  Your Discord session stays on your PC. No remote servers running your account.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-black rounded-lg border border-gray-800">
              <div className="text-green-500 text-xl">🔑</div>
              <div>
                <h4 className="font-bold text-white mb-2">Manual login supported</h4>
                <p className="text-sm text-gray-400">
                  If you don’t set Discord email/password, you can log in manually in the opened
                  browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-gray-800 text-center">
        <p className="text-gray-500 font-mono text-sm mb-4">OPEN SOURCE • PYTHON • PLAYWRIGHT</p>
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-5 text-gray-600 text-xs md:flex-row md:items-start md:text-left">
          <img
            src="/bigfloppa.png"
            alt="BigFloppa avatar"
            className="h-16 w-16 rounded-full border border-gray-800 object-cover"
          />
          <div className="space-y-2">
            <p>
              Creator of this tool is{" "}
              <span className="text-gray-300 font-semibold">BigFloppa</span>.
            </p>
            <p>
              It was vibecoded in 2 days via{" "}
              <span className="text-gray-300 font-semibold">Cursor</span>.
            </p>
            <p>
              For any questions: DM me on{" "}
              <a
                href="https://x.com/BigFloppaEth"
                className="text-neon font-mono hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                X
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
