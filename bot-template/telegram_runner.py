"""Telegram controller for the Discord raffle bot.

Features:
- /start or /start_bot: launch the raffle runner
- /stop_bot: stop the raffle runner
- /status, /stats: basic run status
- Optional Alphabot integration (if ALPHABOT_SESSION_TOKEN is set in .env):
  - /wins: show recent wins as text
  - /winsexcel: export wins to an Excel (.xlsx) file
  - /notis: show closest upcoming mint within 2 days
"""

import asyncio
import html
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from alphabot_wins import export_wins_xlsx, fetch_wins_rows


RAFFLE_PROCESS: Optional[subprocess.Popen] = None


def _is_authorized(update: Update) -> bool:
    """Check if the incoming Telegram user is allowed to control the bot."""
    allowed_id_str = (os.getenv("TELEGRAM_ALLOWED_USER_ID") or "").strip()
    if not allowed_id_str:
        return False

    try:
        allowed_id = int(allowed_id_str)
    except ValueError:
        return False

    user = update.effective_user
    return bool(user and user.id == allowed_id)


def _get_stats_file_path() -> Path:
    """
    Locate the statistics file written by the Discord raffle bot.

    This must mirror DiscordRaffleBot._get_stats_file_path so that we read the
    same JSON the bot writes (by default: project_root / last_run_stats.json).
    """
    env_path = os.getenv("RAFFLE_STATS_FILE")
    if env_path:
        return Path(env_path).expanduser()

    project_root = Path(__file__).resolve().parent
    return project_root / "last_run_stats.json"


def _load_stats() -> Optional[Dict[str, Any]]:
    """Best-effort read of the last-run stats JSON."""
    try:
        path = _get_stats_file_path()
        if not path.is_file():
            return None
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return None
        return data
    except Exception:
        return None


def _format_stats_message(stats: Dict[str, Any]) -> str:
    """Format a human-readable Telegram message from the stats structure (HTML)."""
    def _esc(s: str) -> str:
        return html.escape(str(s))

    total_channels = stats.get("total_channels", 0)
    channels_processed = stats.get("channels_processed", 0)
    channels_with_raffles = stats.get("channels_with_raffles", 0)
    channels_without_raffles = stats.get("channels_without_raffles", 0)
    channels_skipped_no_url = stats.get("channels_skipped_no_url", 0)
    total_raffles_clicked = stats.get("total_raffles_clicked", 0)
    finished_at = stats.get("finished_at_utc", "n/a")

    lines = []
    lines.append("📊 <b>Discord raffle stats (last run)</b>")
    lines.append("")
    lines.append(f"• Total channels in config: {total_channels}")
    lines.append(f"• Channels processed: {channels_processed}")
    lines.append(f"• Channels with raffles: {channels_with_raffles}")
    lines.append(f"• Channels without raffles: {channels_without_raffles}")
    lines.append(f"• Channels skipped (no URL): {channels_skipped_no_url}")
    lines.append(f"• Total raffles entered: {total_raffles_clicked}")
    lines.append(f"• Finished at (UTC): {finished_at}")

    channels = stats.get("channels") or []
    if channels:
        lines.append("")
        lines.append("<b>Per-channel breakdown:</b>")
        for ch in channels:
            name = _esc(ch.get("name", "Unknown"))
            clicked = ch.get("clicked", 0)
            reason = ch.get("reason", "processed")
            if reason == "no_url":
                lines.append(f"  - {name}: skipped (no URL)")
            else:
                lines.append(f"  - {name}: {clicked} raffle(s) entered")

    return "\n".join(lines)


def _format_win_line(row, now: datetime) -> str:
    """Format a single win for /wins output."""
    picked = getattr(row, "picked_dt", None) or now
    delta = now - picked
    days = max(0, int(delta.total_seconds() // 86400))
    if days <= 0:
        won_str = "today"
    elif days == 1:
        won_str = "1 day ago"
    else:
        won_str = f"{days} days ago"

    mint_dt = getattr(row, "mint_dt", None)
    if mint_dt is not None:
        mint_str = mint_dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    else:
        mint_str = "unknown date"

    project = getattr(row, "project", "Unknown")
    return f"{project}, won {won_str}, minting {mint_str}"


def _format_closest_mint_message(rows: Iterable[Any]) -> Optional[str]:
    """Find the closest upcoming mint within the next 2 days."""
    now = datetime.now(timezone.utc)
    max_dt = now + timedelta(days=2)

    candidates = [
        r
        for r in rows
        if getattr(r, "mint_dt", None) is not None and now <= getattr(r, "mint_dt") <= max_dt
    ]
    if not candidates:
        return None

    closest = min(candidates, key=lambda r: getattr(r, "mint_dt"))
    mint_dt = closest.mint_dt.astimezone(timezone.utc)  # type: ignore[union-attr]
    delta = mint_dt - now
    days = delta.days

    if days <= 0:
        when_str = "later today"
    elif days == 1:
        when_str = "in ~1 day"
    else:
        when_str = f"in ~{days} days"

    mint_str = mint_dt.strftime("%Y-%m-%d %H:%M UTC")
    project = getattr(closest, "project", "Unknown")
    return (
        "📅 Closest mint (within 2 days):\n"
        f"- {project}\n"
        f"- Minting {mint_str} ({when_str})"
    )


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/start - start the raffle bot (same as /start_bot)."""
    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    await start_bot_command(update, context)


async def start_bot_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/start_bot - launch the raffle bot process if not already running."""
    global RAFFLE_PROCESS

    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    if RAFFLE_PROCESS and RAFFLE_PROCESS.poll() is None:
        await update.message.reply_text("Raffle bot is already running.")
        return

    await update.message.reply_text("Starting Discord raffle bot...")

    RAFFLE_PROCESS = subprocess.Popen(
        [sys.executable, "-m", "src.main"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )

    await update.message.reply_text("Discord raffle bot started.")

    chat_id = update.effective_chat.id if update.effective_chat else None
    if chat_id is not None:
        context.application.create_task(_notify_when_raffle_finishes(chat_id, context.application))


async def stop_bot_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/stop_bot - terminate the raffle bot process if running."""
    global RAFFLE_PROCESS

    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    if not RAFFLE_PROCESS or RAFFLE_PROCESS.poll() is not None:
        await update.message.reply_text("Raffle bot is not running.")
        RAFFLE_PROCESS = None
        return

    proc = RAFFLE_PROCESS
    RAFFLE_PROCESS = None
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
    await update.message.reply_text("Discord raffle bot stopped.")


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/status - report whether the raffle bot process is running."""
    global RAFFLE_PROCESS

    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    if RAFFLE_PROCESS and RAFFLE_PROCESS.poll() is None:
        await update.message.reply_text(
            "Raffle bot status: RUNNING\n\nUse /stats to see the last completed run statistics."
        )
    else:
        await update.message.reply_text(
            "Raffle bot status: STOPPED\n\nUse /stats to see the last completed run statistics."
        )


async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/stats - report last run statistics."""
    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    stats = _load_stats()
    if not stats:
        await update.message.reply_text(
            "No statistics are available yet.\n\nMake sure you've run the Discord raffle bot at least once."
        )
        return

    message = _format_stats_message(stats)
    await update.message.reply_text(message, parse_mode="HTML")


async def commands_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/commands - list all available bot commands."""
    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    has_alpha = bool(os.getenv("ALPHABOT_SESSION_TOKEN", "").strip())

    lines = [
        "<b>Available commands:</b>",
        "",
        "/start - start the raffle bot (alias for /start_bot)",
        "/start_bot - launch the raffle runner",
        "/stop_bot - stop the raffle runner if it is running",
        "/status - show whether the raffle runner is running",
        "/stats - show last run statistics",
        "/commands - list all commands (this message)",
        "/faq - answers to the most common questions",
    ]

    if has_alpha:
        lines.extend(
            [
                "",
                "/wins - list recent Alphabot wins as text",
                "/winsexcel - export wins to an Excel (.xlsx) file",
                "/notis - show the closest upcoming mint within 2 days",
            ]
        )
    else:
        lines.extend(
            [
                "",
                "<i>Tip: set ALPHABOT_SESSION_TOKEN in .env to enable /wins, /winsexcel and /notis.</i>",
            ]
        )

    await update.message.reply_text("\n".join(lines), parse_mode="HTML")


FAQ_TEXT_EN = """
<b>FAQ — Frequently Asked Questions</b>

<b>1. How to get and run the bot</b>

<b>From the website (recommended):</b> Go to <a href="https://raffle-bot-site.vercel.app/">raffle-bot-site.vercel.app</a> → fill the wizard (Discord channel links, optionally Telegram/AlphaBot) → solve CAPTCHA → download the zip → unzip. Then: <b>Windows</b> — run <code>setup_windows.bat</code> if included (creates venv, installs deps, Playwright), or manually: <code>python -m venv venv</code>, <code>venv\\Scripts\\activate</code>, <code>pip install -r requirements.txt</code>, <code>playwright install chromium</code>. Create <code>.env</code> with your tokens (see FAQ 2–3). Run <code>start_telegram_bot.bat</code> or <code>python telegram_runner.py</code> → send /start in Telegram. <b>macOS/Linux</b> — same idea: <code>python3 -m venv venv</code>, <code>source venv/bin/activate</code>, <code>pip install -r requirements.txt</code>, <code>playwright install chromium</code>, then <code>python telegram_runner.py</code>.

<b>From Python/source:</b> Clone or download the repo → open terminal in the project folder. <b>Windows:</b> <code>python -m venv venv</code>, <code>venv\\Scripts\\activate</code>, <code>pip install -r requirements.txt</code>, create <code>.env</code>, run <code>python telegram_runner.py</code> or <code>python -m src.main</code>. <b>macOS/Linux:</b> <code>python3 -m venv venv</code>, <code>source venv/bin/activate</code>, <code>pip install -r requirements.txt</code>, then same.

<b>2. How to get your AlphaBot session token</b>

Log in to AlphaBot in your browser → press F12 (DevTools) → Application tab → Cookies → select the AlphaBot site → find <code>__Secure-next-auth.session-token</code> → copy its Value → paste into <code>.env</code> as <code>ALPHABOT_SESSION_TOKEN=...</code>.

*3. How to get your Telegram ID and the bot’s Telegram ID*

• <b>Your Telegram user ID:</b> Send any message to @userinfobot or @getidsbot; they reply with your numeric user ID. Put it in <code>.env</code> as <code>TELEGRAM_ALLOWED_USER_ID=123456789</code>.
• <b>Bot token (from BotFather):</b> Create a bot via @BotFather, then use the token he gives you as <code>TELEGRAM_BOT_TOKEN</code> in <code>.env</code>. The “bot ID” in the usual sense is that token; there is no separate numeric “bot user ID” you need for this setup.

<b>4. How to get a Discord channel link</b>

In Discord (app or web): open the server → go to the channel → right‑click the channel name in the list → “Copy channel link” (or “Copy Link”). The link looks like: <code>https://discord.com/channels/SERVER_ID/CHANNEL_ID</code>. Put this URL into your `config.json` under the channel’s `url` field.

<b>5. More questions?</b>

Contact the creator on X: https://x.com/BigFloppaEth
"""


async def faq_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/faq - show answers to the most common questions (in English)."""
    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    await update.message.reply_text(FAQ_TEXT_EN.strip(), parse_mode="HTML")


async def wins_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/wins - show recent Alphabot wins as text (requires ALPHABOT_SESSION_TOKEN)."""
    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    session_token = os.getenv("ALPHABOT_SESSION_TOKEN", "").strip()
    if not session_token:
        await update.message.reply_text(
            "ALPHABOT_SESSION_TOKEN is not set.\n\n"
            "If you want /wins to work, open alphabot in your browser → DevTools → "
            "Application → Cookies → __Secure-next-auth.session-token → copy Value into .env "
            "as ALPHABOT_SESSION_TOKEN."
        )
        return

    await update.message.reply_text("Fetching latest Alphabot wins…")

    try:
        rows = await fetch_wins_rows(session_token=session_token)
    except Exception as e:
        await update.message.reply_text(f"Failed to fetch wins: {e}")
        return

    if not rows:
        await update.message.reply_text("No recent wins were found.")
        return

    now = datetime.now(timezone.utc)
    rows_sorted = sorted(
        rows,
        key=lambda r: getattr(r, "picked_dt", getattr(r, "mint_dt", now)) or now,
        reverse=True,
    )

    top_rows = rows_sorted[:15]
    lines = [_format_win_line(r, now) for r in top_rows]
    msg = "Latest wins (up to 15):\n" + "\n".join(f"- {line}" for line in lines)
    await update.message.reply_text(msg)


async def winsexcel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/winsexcel - export Alphabot wins to an XLSX and send it here (requires ALPHABOT_SESSION_TOKEN)."""
    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    session_token = os.getenv("ALPHABOT_SESSION_TOKEN", "").strip()
    if not session_token:
        await update.message.reply_text(
            "ALPHABOT_SESSION_TOKEN is not set.\n\n"
            "Open alphabot in your browser → DevTools → Application → Cookies → "
            "__Secure-next-auth.session-token → copy Value into .env as ALPHABOT_SESSION_TOKEN."
        )
        return

    out_path = str(Path(__file__).resolve().parent / "won_raffles.xlsx")

    await update.message.reply_text("Checking Alphabot wins… generating Excel file (this can take ~10–60s).")

    try:
        file_path, count = await export_wins_xlsx(
            session_token=session_token,
            out_path=out_path,
        )
    except Exception as e:
        await update.message.reply_text(f"Failed to export wins: {e}")
        return

    try:
        await update.message.reply_document(
            document=open(file_path, "rb"),
            filename="won_raffles.xlsx",
            caption=f"✅ Wins exported. Rows in file: {count}\n\n"
            f"(Projects with mint date older than 7 days are removed automatically.)",
        )
    except Exception as e:
        await update.message.reply_text(f"Exported but could not send file: {e}\nSaved at: {file_path}")


async def notis_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/notis - show the closest upcoming mint within 2 days (requires ALPHABOT_SESSION_TOKEN)."""
    if not _is_authorized(update):
        await update.message.reply_text("You are not allowed to control this bot.")
        return

    session_token = os.getenv("ALPHABOT_SESSION_TOKEN", "").strip()
    if not session_token:
        await update.message.reply_text(
            "ALPHABOT_SESSION_TOKEN is not set.\n\n"
            "Open alphabot in your browser → DevTools → Application → Cookies → "
            "__Secure-next-auth.session-token → copy Value into .env as ALPHABOT_SESSION_TOKEN."
        )
        return

    await update.message.reply_text("Checking upcoming mints…")

    try:
        rows = await fetch_wins_rows(session_token=session_token)
    except Exception as e:
        await update.message.reply_text(f"Failed to fetch wins for notifications: {e}")
        return

    msg = _format_closest_mint_message(rows)
    if not msg:
        await update.message.reply_text("No mints found within the next 2 days.")
        return

    await update.message.reply_text(msg)


async def _notify_when_raffle_finishes(chat_id: int, app: "Application") -> None:
    """
    Send stats as soon as the raffle run finishes (stats file updated), not when
    the user stops the bot. Polls the stats file; when it is modified after we
    started, send the message. Also send on process exit if we haven't sent yet.
    """
    global RAFFLE_PROCESS

    start_time = time.time()
    stats_file = _get_stats_file_path()
    already_sent = False

    while True:
        proc = RAFFLE_PROCESS
        if not proc:
            break
        if proc.poll() is not None:
            if not already_sent:
                stats = _load_stats()
                if stats:
                    message = "✅ Successfully registered raffles.\n\n" + _format_stats_message(stats)
                    await app.bot.send_message(chat_id=chat_id, text=message, parse_mode="HTML")
                else:
                    await app.bot.send_message(
                        chat_id=chat_id,
                        text="✅ Discord raffle bot finished.\n\n(No statistics file was found.)",
                    )
            break

        if not already_sent and stats_file.is_file():
            try:
                mtime = stats_file.stat().st_mtime
                if mtime >= start_time:
                    await asyncio.sleep(1)
                    stats = _load_stats()
                    if stats:
                        already_sent = True
                        message = "✅ Successfully registered raffles.\n\n" + _format_stats_message(stats)
                        await app.bot.send_message(chat_id=chat_id, text=message, parse_mode="HTML")
                    else:
                        already_sent = True
                        await app.bot.send_message(
                            chat_id=chat_id,
                            text="✅ Discord raffle bot finished.\n\n(No statistics file was found.)",
                        )
            except OSError:
                pass

        await asyncio.sleep(5)


async def _startup_notis_post_init(app: "Application") -> None:
    """
    Optional hook: after startup, send a closest-mint notification once
    if Alphabot token + TELEGRAM_ALLOWED_USER_ID are configured.
    """
    session_token = os.getenv("ALPHABOT_SESSION_TOKEN", "").strip()
    allowed_id_str = os.getenv("TELEGRAM_ALLOWED_USER_ID", "").strip()

    if not session_token or not allowed_id_str:
        return

    try:
        chat_id = int(allowed_id_str)
    except ValueError:
        return

    try:
        rows = await fetch_wins_rows(session_token=session_token)
    except Exception:
        return

    msg = _format_closest_mint_message(rows)
    if not msg:
        msg = "No mints found within the next 2 days (startup check)."

    await app.bot.send_message(chat_id=chat_id, text=msg)


def main() -> None:
    project_root = Path(__file__).resolve().parent
    env_path = project_root / ".env"
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path)

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("TELEGRAM_BOT_TOKEN is not set. Please set it in your environment or .env file.")
        return

    app = Application.builder().token(token).build()
    app.post_init = _startup_notis_post_init  # type: ignore[assignment]

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("start_bot", start_bot_command))
    app.add_handler(CommandHandler("stop_bot", stop_bot_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(CommandHandler("stats", stats_command))
    app.add_handler(CommandHandler("wins", wins_command))
    app.add_handler(CommandHandler("winsexcel", winsexcel_command))
    app.add_handler(CommandHandler("notis", notis_command))
    app.add_handler(CommandHandler("commands", commands_command))
    app.add_handler(CommandHandler("faq", faq_command))

    print("Telegram control bot is running. Press Ctrl+C to stop.")
    app.run_polling()


if __name__ == "__main__":
    main()

