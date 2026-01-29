<div align="center">

# 🤖 Discord Raffle Bot
### Automated Alpha Hunter

[![CodeQL](https://github.com/bigfloppaeth/raffle-bot-site/actions/workflows/codeql.yml/badge.svg)](https://github.com/bigfloppaeth/raffle-bot-site/actions/workflows/codeql.yml)
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

## 🚀 Installation & Setup

### 1. Install Python Dependencies

```bash
# Create virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
