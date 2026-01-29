<div align="center">

# 🤖 Discord Raffle Bot
### Automated Alpha Hunter

[![CodeQL](https://github.com/bigfloppaeth/raffle-bot-site/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/bigfloppaeth/raffle-bot-site/actions/workflows/github-code-scanning/codeql)
[![Python](https://img.shields.io/badge/Made_with-Python_3.10+-blue?style=for-the-badge&logo=python)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Stop Clicking. Start Winning.</b><br>
  A stealth, local browser automation tool that scans Discord channels and enters raffles while you sleep.<br>
  <i>Powered by Playwright. Undetectable. Open Source.</i>
</p>

</div>

---

### 🛡️ Security & Transparency

We operate on a **"Don't Trust, Verify"** basis. This tool is designed for privacy and security.

* ✅ **Verified Code:** Our source code is clean. Check the **CodeQL** badge above.
* ✅ **Local Execution:** Your Discord tokens and passwords **never** leave your PC. The bot runs 100% locally.
* ✅ **Open Source:** No obfuscation. You can audit every line in `src/`.
* ✅ **Stealth:** Uses a real Chrome instance with unique fingerprints. No API bans.

---

## ⚡ Features

* **👻 Ghost Mode:** Simulates human behavior with randomized delays, natural mouse curves, and scrolling. Discord sees a user, not a script.
* **🧠 Smart Scanning:** Jumps to the newest messages and scans *upwards*. Automatically detects "Ended" raffles and moves to the next channel.
* **🏭 Multi-Channel:** Process multiple Discord channels (by URL) from a config file.
* **📱 Remote Control:** Start, stop, and get live stats directly from **Telegram**.
* **🔐 Persistent Login:** Uses your existing Chrome profile. **No 2FA headaches**—login once, run forever.
* **🪟 Minimized Mode:** Browser runs minimized while you work in other windows.

---

## 🚀 Quick Start Guide

Go from zero to alpha in 4 simple steps.

### 1. Configure ⚙️
Rename `.env.example` to `.env` and add your details.
* **Discord:** Add your `DISCORD_EMAIL` and `DISCORD_PASSWORD`.
* **Targets:** Open `config.json` and paste the links to the raffle channels you want to farm.

### 2. Install 📦
We've included a one-click setup script.
* **Windows:** Double-click `setup_windows.bat`.
* **Manual:** Run `pip install -r requirements.txt` and `playwright install chromium`.

### 3. Connect Telegram (Optional) 📱
Want to control the bot from your phone?
* Create a bot via **@BotFather** and get the Token.
* Get your ID via **@userinfobot**.
* Paste them into your `.env` file.

### 4. Launch & Hunt 🟢
Start the engine.
* **Run:** `start_telegram_bot.bat` (or `python telegram_runner.py`).
* **Command:** Open Telegram and send `/start`.
* **Result:** The bot will open the browser, login, and start scanning for "Enter Raffle" buttons.

---

## ⚠️ Important Notes

> **First Run:** The bot uses a dedicated Chromium profile. If you need to log in or solve a Captcha, do it manually in the opened window. The bot will wait.

> **Troubleshooting:** If the bot says "Could not find server", ensure the server name in `config.json` matches exactly how it appears in your Discord sidebar.

---

### Disclaimer
*This tool is for educational purposes only. Use responsibly. The authors are not responsible for any account limitations resulting from misuse.*
