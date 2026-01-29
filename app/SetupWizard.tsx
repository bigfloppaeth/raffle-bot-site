"use client";

import { useCallback, useMemo, useState } from "react";
import { Turnstile } from "./Turnstile";

type WizardState = {
  targetOs: "windows" | "mac" | "linux";
  projectFolderName: string;
  telegramBotToken: string;
  telegramAllowedUserId: string;
  alphabotSessionToken: string;
  discordChannelLinks: string;
  includeWindowsSetup: boolean;
  turnstileToken: string;
};

export function SetupWizard() {
  const [state, setState] = useState<WizardState>({
    targetOs: "windows",
    projectFolderName: "discord-raffle-bot",
    telegramBotToken: "",
    telegramAllowedUserId: "",
    alphabotSessionToken: "",
    discordChannelLinks: "",
    includeWindowsSetup: true,
    turnstileToken: "",
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelsCount = useMemo(() => {
    return state.discordChannelLinks
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [state.discordChannelLinks]);

  const onCaptchaToken = useCallback((token: string) => {
    setState((s) => ({ ...s, turnstileToken: token }));
  }, []);

  async function onDownload() {
    setError(null);
    setIsDownloading(true);
    try {
      if (!state.turnstileToken) {
        throw new Error("Please complete the CAPTCHA before downloading.");
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });

      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(msg?.error || `Request failed (${res.status})`);
      }

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const match = /filename="([^"]+)"/i.exec(cd);
      const filename = match?.[1] || "discord-raffle-bot.zip";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 rounded-2xl border border-gray-800 bg-[#0F172A]/90 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.7)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon/50 to-transparent opacity-50" />

      <h2 className="text-2xl font-bold text-white mb-2">Generate your ready-to-run bot folder</h2>
      <p className="text-gray-400 text-sm mb-8">
        Fill what you want, download a zip, and run it locally. Telegram and Alphabot fields are
        optional (you can fill them later in{" "}
        <code className="bg-black px-1 py-0.5 rounded text-neon font-mono text-xs">.env</code>).
        If you add your Alphabot token, <span className="text-white">/wins</span>,{" "}
        <span className="text-white">/winsexcel</span>, and{" "}
        <span className="text-white">/notis</span> will work out of the box. To see all features,
        send <span className="text-white font-mono text-xs">/commands</span> to your Telegram bot.
      </p>

      <div className="mb-6">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
          Target OS
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { id: "windows", label: "Windows" },
              { id: "mac", label: "macOS" },
              { id: "linux", label: "Linux" },
            ] as const
          ).map((opt) => {
            const active = state.targetOs === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, targetOs: opt.id }))}
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm font-mono transition",
                  active
                    ? "border-neon bg-black/40 text-white shadow-[0_0_12px_rgba(16,185,129,0.18)]"
                    : "border-gray-800 bg-black/20 text-gray-400 hover:border-gray-700 hover:text-gray-200",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Windows gets <span className="font-mono text-gray-300">.bat</span> files; macOS/Linux gets{" "}
          <span className="font-mono text-gray-300">.sh</span> files (run with{" "}
          <span className="font-mono text-gray-300">chmod +x</span>).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            Project folder name
          </label>
          <input
            type="text"
            value={state.projectFolderName}
            onChange={(e) => setState((s) => ({ ...s, projectFolderName: e.target.value }))}
            className="w-full bg-black/40 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition font-mono placeholder-gray-600"
            placeholder="folder-name"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            Telegram Allowed User ID <span className="text-gray-600">(Optional)</span>
          </label>
          <input
            type="text"
            value={state.telegramAllowedUserId}
            onChange={(e) => setState((s) => ({ ...s, telegramAllowedUserId: e.target.value }))}
            className="w-full bg-black/40 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition font-mono placeholder-gray-600"
            placeholder="123456789"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
          Telegram Bot Token <span className="text-gray-600">(Optional)</span>
        </label>
        <input
          type="text"
          value={state.telegramBotToken}
          onChange={(e) => setState((s) => ({ ...s, telegramBotToken: e.target.value }))}
          className="w-full bg-black/40 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition font-mono placeholder-gray-600"
          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
        />
        <p className="text-xs text-gray-500 mt-2">
          If you don't want to share it with the site, leave it blank and fill it yourself in .env
          after download.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
          Alphabot Session Token <span className="text-gray-600">(Optional)</span>
        </label>
        <input
          type="text"
          value={state.alphabotSessionToken}
          onChange={(e) => setState((s) => ({ ...s, alphabotSessionToken: e.target.value }))}
          className="w-full bg-black/40 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition font-mono placeholder-gray-600"
          placeholder="__Secure-next-auth.session-token value"
        />
        <p className="text-xs text-gray-500 mt-2">
          This enables <span className="text-white font-mono text-xs">/wins</span>,{" "}
          <span className="text-white font-mono text-xs">/winsexcel</span>, and{" "}
          <span className="text-white font-mono text-xs">/notis</span> in Telegram. To learn how to
          get your Alphabot token, click{" "}
          <a href="#ab-token-guide" className="text-neon font-mono underline">
            here
          </a>
          .
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">
            Discord channel links (one per line)
          </label>
          <span className="text-xs text-gray-500 font-mono">
            {channelsCount} link{channelsCount === 1 ? "" : "s"}
          </span>
        </div>
        <textarea
          rows={5}
          value={state.discordChannelLinks}
          onChange={(e) => setState((s) => ({ ...s, discordChannelLinks: e.target.value }))}
          className="w-full bg-black/40 border border-gray-700 text-green-400 p-3 rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition font-mono text-sm placeholder-gray-700 resize-none"
          placeholder={
            "https://discord.com/channels/922262508247597077/1038563106386890853\nhttps://discord.com/channels/......"
          }
        />
      </div>

      <div className="flex items-start gap-3 mb-6 p-4 border border-gray-800 rounded-lg bg-gray-900/50">
        <div className="flex items-center h-5">
          <input
            id="setup_scripts"
            type="checkbox"
            checked={state.includeWindowsSetup}
            onChange={(e) => setState((s) => ({ ...s, includeWindowsSetup: e.target.checked }))}
            className="w-4 h-4 text-neon bg-gray-800 border-gray-600 rounded focus:ring-neon focus:ring-2"
          />
        </div>
        <div className="ml-1 text-sm">
          <label htmlFor="setup_scripts" className="font-medium text-gray-200">
            Include setup scripts + helpers
          </label>
          <p className="text-gray-500 mt-1">
            Adds{" "}
            <code className="bg-black/50 px-1 py-0.5 rounded text-gray-300 font-mono text-xs">
              {state.targetOs === "windows" ? "setup_windows.bat" : "setup_unix.sh"}
            </code>{" "}
            (creates venv, installs deps, installs Playwright Chromium)
            {state.targetOs === "windows" ? " + Desktop shortcut creator." : "."}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-800">
        <div className="grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition">
          <div className="bg-white p-2 rounded border border-gray-300">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              onToken={onCaptchaToken}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full md:w-auto px-8 py-3 bg-neon text-black font-bold font-mono rounded hover:bg-white hover:scale-105 transition transform shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isDownloading ? "PREPARING..." : "DOWNLOAD .ZIP"}
        </button>
      </div>
    </div>
  );
}

