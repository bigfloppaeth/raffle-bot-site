"""Simple Telegram bot to start/stop the Discord raffle bot remotely.

Usage:
    1. Install dependencies:
         pip install -r requirements.txt

    2. Set environment variables (for security, do this in your shell or .env):
         TELEGRAM_BOT_TOKEN=123456:ABC...
         TELEGRAM_ALLOWED_USER_ID=123456789   # your Telegram numeric user ID

    3. Start the Telegram control bot (inside your venv, from project root):
         python telegram_runner.py

    4. In Telegram, send these commands to your bot:
         /start_bot  - start the Discord raffle bot (python -m src.main)
         /stop_bot   - stop it, if it's running
         /status     - show whether it's running
         /stats      - show last run statistics

This script only controls a separate process running src.main. It does NOT
change the internals of the Discord raffle bot itself.
"""

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

RAFFLE_PROCESS: Optional[subprocess.Popen] = None


def _is_authorized(update: Update) -> bool:
    """Check if the incoming Telegram user is allowed to control the bot."""
    allowed_id_str = os.getenv("TELEGRAM_ALLOWED_USER_ID")
    if not allowed_id_str:
        # If no ID configured, allow everyone (for quick local testing).
        return True

    try:
        allowed_id = int(allowed_id_str)
    except ValueError:
        return True

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
    """Format a human-readable Telegram message from the stats structure."""
    total_channels = stats.get("total_channels", 0)
    channels_processed = stats.get("channels_processed", 0)
    channels_with_raffles = stats.get("channels_with_raffles", 0)
    channels_without_raffles = stats.get("channels_without_raffles", 0)
    channels_skipped_no_url = stats.get("channels_skipped_no_url", 0)
    total_raffles_clicked = stats.get("total_raffles_clicked", 0)
    finished_at = stats.get("finished_at_utc", "n/a")

    lines = []
    lines.append("📊 *Discord raffle stats (last run)*")
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
        lines.append("*Per-channel breakdown:*")
        for ch in channels:
            name = ch.get("name", "Unknown")
            clicked = ch.get("clicked", 0)
            reason = ch.get("reason", "processed")
            if reason == "no_url":
                lines.append(f"  - {name}: skipped (no URL)")
            else:
                lines.append(f"  - {name}: {clicked} raffle(s) entered")

    return "\n".join(lines)


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

    RAFFLE_PROCESS.terminate()
    try:
        RAFFLE_PROCESS.wait(timeout=10)
    except subprocess.TimeoutExpired:
        RAFFLE_PROCESS.kill()

    RAFFLE_PROCESS = None
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
    await update.message.reply_text(message, parse_mode="Markdown")


async def _notify_when_raffle_finishes(chat_id: int, app: "Application") -> None:
    """Wait for raffle process to finish, then send summary into the same chat."""
    global RAFFLE_PROCESS

    while True:
        proc = RAFFLE_PROCESS
        if not proc:
            break
        if proc.poll() is not None:
            break
        await asyncio.sleep(5)

    stats = _load_stats()
    if stats:
        message = "✅ Successfully registered raffles.\n\n" + _format_stats_message(stats)
        await app.bot.send_message(chat_id=chat_id, text=message, parse_mode="Markdown")
    else:
        await app.bot.send_message(
            chat_id=chat_id,
            text="✅ Discord raffle bot finished.\n\n(No statistics file was found.)",
        )


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
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("start_bot", start_bot_command))
    app.add_handler(CommandHandler("stop_bot", stop_bot_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(CommandHandler("stats", stats_command))

    print("Telegram control bot is running. Press Ctrl+C to stop.")
    app.run_polling()


if __name__ == "__main__":
    main()

