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

function makeReadme(folderName: string) {
  return `# ${folderName}

This folder was generated from the website setup wizard.

## Quick start (Windows)

\`\`\`bat
python -m venv venv
call venv\\Scripts\\activate
pip install -r requirements.txt
python telegram_runner.py
\`\`\`

## Notes

- If Playwright is installed, run: \`python -m playwright install chromium\`
- Configure Discord credentials in \`.env\`
- Configure channels in \`config.json\`
`;
}

function readTemplateFiles(folderName: string) {
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
        rel.endsWith(".pyc")
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

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const channels = normalizeLines(body.discordChannelLinks || "");
  const folderName = sanitizeFolderName(body.projectFolderName || "discord-raffle-bot");

  const templateFiles = readTemplateFiles(folderName);

  // Overwrite/ensure these generated config files are present.
  templateFiles.push({ path: `${folderName}/README.md`, data: makeReadme(folderName) });
  templateFiles.push({ path: `${folderName}/.env`, data: makeEnv(body) });
  templateFiles.push({ path: `${folderName}/config.json`, data: makeConfigJson(channels) });

  if (body.includeWindowsSetup) {
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

