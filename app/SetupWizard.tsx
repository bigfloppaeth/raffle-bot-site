"use client";

import { useMemo, useState } from "react";

type WizardState = {
  projectFolderName: string;
  telegramBotToken: string;
  telegramAllowedUserId: string;
  discordChannelLinks: string;
  includeWindowsSetup: boolean;
};

export function SetupWizard() {
  const [state, setState] = useState<WizardState>({
    projectFolderName: "discord-raffle-bot",
    telegramBotToken: "",
    telegramAllowedUserId: "",
    discordChannelLinks: "",
    includeWindowsSetup: true,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelsCount = useMemo(() => {
    return state.discordChannelLinks
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [state.discordChannelLinks]);

  async function onDownload() {
    setError(null);
    setIsDownloading(true);
    try {
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
    <section className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
        <h2 className="text-xl font-semibold">Generate your ready-to-run bot folder</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Fill what you want, download a zip, and run it locally. Telegram fields are optional (you
          can fill them later in <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">.env</code>
          ).
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Project folder name</div>
            <input
              value={state.projectFolderName}
              onChange={(e) => setState((s) => ({ ...s, projectFolderName: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="discord-raffle-bot"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">
              Telegram allowed user id <span className="text-zinc-500">(optional)</span>
            </div>
            <input
              value={state.telegramAllowedUserId}
              onChange={(e) => setState((s) => ({ ...s, telegramAllowedUserId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="123456789"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-sm font-medium">
              Telegram bot token <span className="text-zinc-500">(optional)</span>
            </div>
            <input
              value={state.telegramBotToken}
              onChange={(e) => setState((s) => ({ ...s, telegramBotToken: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm outline-none ring-emerald-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="123456:ABCDEF..."
            />
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              If you don’t want to share it with the site, leave it blank and fill it yourself in{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">.env</code> after download.
            </div>
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Discord channel links (one per line)</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                {channelsCount} link{channelsCount === 1 ? "" : "s"}
              </div>
            </div>
            <textarea
              value={state.discordChannelLinks}
              onChange={(e) => setState((s) => ({ ...s, discordChannelLinks: e.target.value }))}
              className="min-h-28 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm outline-none ring-emerald-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
              placeholder={[
                "https://discord.com/channels/922262508247597077/1038563106386890853",
                "https://discord.com/channels/....../......",
              ].join("\n")}
            />
          </label>

          <label className="flex items-start gap-3 md:col-span-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-emerald-600"
              checked={state.includeWindowsSetup}
              onChange={(e) => setState((s) => ({ ...s, includeWindowsSetup: e.target.checked }))}
            />
            <div>
              <div className="text-sm font-medium">Include Windows setup + shortcut helpers</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                Adds <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">setup_windows.bat</code>{" "}
                (creates venv, installs deps, installs Playwright Chromium) and a script to create a
                Desktop shortcut to start the Telegram controller.
              </div>
            </div>
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? "Preparing zip…" : "Download configured zip"}
          </button>

          <div className="text-xs text-zinc-600 dark:text-zinc-300">
            The zip includes <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">.env</code>{" "}
            and <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">config.json</code>{" "}
            already filled.
          </div>
        </div>
      </div>
    </section>
  );
}

