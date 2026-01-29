import { NextResponse } from "next/server";
import { createZipStore } from "@/lib/zip";
import fs from "node:fs";
import path from "node:path";

type GenerateRequest = {
  telegramBotToken?: string;
  telegramAllowedUserId?: string;
  discordChannelLinks: string; // newline-separated
  projectFolderName?: string;
  includeWindowsSetup?: boolean;
  targetOs?: "windows" | "mac" | "linux";
  turnstileToken?: string;
};

function sanitizeFolderName(name: string) {
  const trimmed = name.trim() || "discord-raffle-bot";
  // Keep it simple for Windows paths
  const safe = trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").slice(0, 60);
  return safe || "discord-raffle-bot";
}

function normalizeLines(input: string) {
  return input
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function makeConfigJson(channels: string[]) {
  const channelObjs = channels.map((url, idx) => ({
    name: `Channel ${idx + 1}`,
    url,
  }));
  return JSON.stringify(
    {
      channels: channelObjs,
      raffle_button_selectors: ["button:has-text('Enter Raffle')"],
      navigation: { wait_for_page_load: 5000, scroll_delay: 2000 },
    },
    null,
    2,
  );
}

function makeEnv(req: GenerateRequest) {
  // Keep other .env.example keys present, optionally override Telegram vars.
  const tplPath = path.join(process.cwd(), "bot-template", ".env.example");
  const tpl = fs.existsSync(tplPath) ? fs.readFileSync(tplPath, "utf8") : "";

  function upsertEnvVar(src: string, key: string, value: string) {
    const lines = src.split(/\r?\n/g);
    const idx = lines.findIndex((l) => l.trimStart().startsWith(`${key}=`));
    if (idx >= 0) lines[idx] = `${key}=${value}`;
    else lines.push(`${key}=${value}`);
    return lines.join("\n");
  }

  let out = tpl.trimEnd();
  const token = req.telegramBotToken?.trim();
  const allowed = req.telegramAllowedUserId?.trim();

  if (token) out = upsertEnvVar(out, "TELEGRAM_BOT_TOKEN", token);
  if (allowed) out = upsertEnvVar(out, "TELEGRAM_ALLOWED_USER_ID", allowed);

  return (out + "\n").replace(/\n{3,}/g, "\n\n");
}

function makeReadme(folderName: string, targetOs: "windows" | "mac" | "linux") {
  const isWindows = targetOs === "windows";
  const setupCmd = isWindows ? "setup_windows.bat" : "./setup_unix.sh";
  const startCmd = isWindows ? "start_telegram_bot.bat" : "./start_telegram_bot.sh";

  return `# ${folderName}

This folder was generated from the website setup wizard.

## Quick start (${isWindows ? "Windows" : "macOS/Linux"})

${isWindows ? "Run:" : "Run:"}

${isWindows ? "```bat" : "```bash"}
${isWindows ? "setup_windows.bat" : "chmod +x setup_unix.sh start_telegram_bot.sh"}
${isWindows ? "" : setupCmd}
${isWindows ? "start_telegram_bot.bat" : startCmd}
${isWindows ? "```" : "```"}

## Notes

- If Playwright is installed, run: \`python -m playwright install chromium\`
- Configure Discord credentials in \`.env\`
- Configure channels in \`config.json\`
`;
}

function readTemplateFiles(folderName: string, targetOs: "windows" | "mac" | "linux") {
  const templateRoot = path.join(process.cwd(), "bot-template");
  const out: { path: string; data: string | Uint8Array }[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(templateRoot, full).replace(/\\/g, "/");

      // Exclude anything that could contain secrets or be huge.
      if (
        rel === ".env" ||
        rel.startsWith(".env.") ||
        rel.includes("/__pycache__/") ||
        rel.startsWith("venv/") ||
        rel.startsWith(".venv/") ||
        rel.endsWith(".pyc") ||
        // OS-specific: avoid shipping irrelevant launcher scripts
        (targetOs !== "windows" && rel.toLowerCase().endsWith(".bat"))
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const data = fs.readFileSync(full);
        out.push({ path: `${folderName}/${rel}`, data });
      }
    }
  }

  if (fs.existsSync(templateRoot)) {
    walk(templateRoot);
  }
  return out;
}

// Basic in-memory per-IP rate limiting (works well enough on Vercel, but is not perfectly global).
// For stronger protection across all regions/instances, swap this for Upstash/Vercel KV later.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 downloads/min per IP
const rateLimitHits = new Map<string, number[]>();

function getClientIp(req: Request) {
  // Vercel typically sets x-forwarded-for. Fall back to "unknown".
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const hits = rateLimitHits.get(ip) || [];
  const recent = hits.filter((t) => t > cutoff);
  recent.push(now);
  rateLimitHits.set(ip, recent);
  return recent.length <= RATE_LIMIT_MAX;
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, reason: "CAPTCHA is not configured on the server." };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip && ip !== "unknown") form.set("remoteip", ip);

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = (await resp.json().catch(() => null)) as
    | { success?: boolean; "error-codes"?: string[] }
    | null;

  if (!data?.success) {
    return { ok: false, reason: "CAPTCHA failed." };
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  const token = body.turnstileToken?.trim() || "";
  if (!token) {
    return NextResponse.json({ error: "CAPTCHA is required." }, { status: 400 });
  }
  const captcha = await verifyTurnstile(token, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.reason }, { status: 400 });
  }

  const channels = normalizeLines(body.discordChannelLinks || "");
  const folderName = sanitizeFolderName(body.projectFolderName || "discord-raffle-bot");
  const targetOs: "windows" | "mac" | "linux" = body.targetOs || "windows";
  const includeSetup = Boolean(body.includeWindowsSetup);

  const templateFiles = readTemplateFiles(folderName, targetOs);

  // Overwrite/ensure these generated config files are present.
  templateFiles.push({
    path: `${folderName}/README.md`,
    data: makeReadme(folderName, targetOs),
  });
  templateFiles.push({ path: `${folderName}/.env`, data: makeEnv(body) });
  templateFiles.push({ path: `${folderName}/config.json`, data: makeConfigJson(channels) });

  // Always include a start script appropriate for the OS.
  if (targetOs !== "windows") {
    templateFiles.push({
      path: `${folderName}/start_telegram_bot.sh`,
      data:
        "#!/usr/bin/env bash\n" +
        "set -euo pipefail\n" +
        'cd "$(dirname "$0")"\n' +
        "if [ -f \"venv/bin/activate\" ]; then\n" +
        "  # shellcheck disable=SC1091\n" +
        "  source \"venv/bin/activate\"\n" +
        "fi\n" +
        "python3 telegram_runner.py\n",
    });
  }

  if (includeSetup) {
    if (targetOs === "windows") {
    templateFiles.push({
      path: `${folderName}/setup_windows.bat`,
      data:
        "@echo off\r\n" +
        "setlocal\r\n" +
        "cd /d \"%~dp0\"\r\n" +
        "echo Creating virtual environment...\r\n" +
        "if not exist venv (\r\n" +
        "  python -m venv venv\r\n" +
        ")\r\n" +
        "call venv\\Scripts\\activate.bat\r\n" +
        "echo Installing dependencies...\r\n" +
        "python -m pip install --upgrade pip\r\n" +
        "pip install -r requirements.txt\r\n" +
        "echo Installing Playwright Chromium...\r\n" +
        "python -m playwright install chromium\r\n" +
        "echo Done.\r\n" +
        "echo Next: double-click start_telegram_bot.bat\r\n" +
        "pause\r\n",
    });

    templateFiles.push({
      path: `${folderName}/create_desktop_shortcut.bat`,
      data:
        "@echo off\r\n" +
        "setlocal\r\n" +
        "cd /d \"%~dp0\"\r\n" +
        "powershell -NoProfile -ExecutionPolicy Bypass -Command " +
        "\"$Wsh = New-Object -ComObject WScript.Shell; " +
        "$Desktop = [Environment]::GetFolderPath('Desktop'); " +
        "$Shortcut = $Wsh.CreateShortcut((Join-Path $Desktop 'Start Discord Raffle Bot.lnk')); " +
        "$Shortcut.TargetPath = (Join-Path (Get-Location) 'start_telegram_bot.bat'); " +
        "$Shortcut.WorkingDirectory = (Get-Location).Path; " +
        "$Shortcut.IconLocation = (Join-Path $env:SystemRoot 'System32\\\\shell32.dll,167'); " +
        "$Shortcut.Save()\"\r\n" +
        "echo Desktop shortcut created.\r\n" +
        "pause\r\n",
    });
    } else {
      templateFiles.push({
        path: `${folderName}/setup_unix.sh`,
        data:
          "#!/usr/bin/env bash\n" +
          "set -euo pipefail\n" +
          'cd "$(dirname "$0")"\n' +
          "python3 -m venv venv\n" +
          // shellcheck is not guaranteed to exist; keep it plain.
          "source \"venv/bin/activate\"\n" +
          "python -m pip install --upgrade pip\n" +
          "pip install -r requirements.txt\n" +
          "python -m playwright install chromium\n" +
          "echo \"Done. Next: ./start_telegram_bot.sh\"\n",
      });
    }
  }

  const zip = createZipStore(templateFiles);

  return new NextResponse(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${folderName}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}

