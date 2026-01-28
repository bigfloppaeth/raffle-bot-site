"""Main Discord browser automation bot."""

import asyncio
import json
import os
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from playwright.async_api import (
    async_playwright,
    Playwright,
    Browser,
    BrowserContext,
    Page,
    TimeoutError as PlaywrightTimeoutError,
)

from .config import get_settings


class DiscordRaffleBot:
    """Bot that automates Discord raffle entry via browser."""

    def __init__(self):
        self.settings = get_settings()
        self.config = self.settings.load_config_json()
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.using_persistent_context = False
        # Simple per-run statistics (safe defaults so nothing breaks existing flows)
        self.stats: Dict[str, Any] = {
            "total_channels": 0,
            "channels_processed": 0,
            "channels_with_raffles": 0,
            "channels_without_raffles": 0,
            "channels_skipped_no_url": 0,
            "total_raffles_clicked": 0,
            "channels": [],
        }

    async def _human_delay(self, min_ms: Optional[int] = None, max_ms: Optional[int] = None):
        """Add random delay to simulate human behavior."""
        min_delay = min_ms or self.settings.action_delay_min
        max_delay = max_ms or self.settings.action_delay_max
        delay = random.uniform(min_delay / 1000, max_delay / 1000)
        await asyncio.sleep(delay)

    async def _wait_for_element(
        self, selector: str, timeout: Optional[int] = None, visible: bool = True
    ) -> bool:
        """Wait for an element to appear on the page."""
        try:
            timeout = timeout or self.settings.browser_timeout
            if visible:
                await self.page.wait_for_selector(selector, state="visible", timeout=timeout)
            else:
                await self.page.wait_for_selector(selector, timeout=timeout)
            return True
        except PlaywrightTimeoutError:
            return False

    async def _click_element(self, selector: str, retries: int = 3) -> bool:
        """Click an element with retries."""
        for attempt in range(retries):
            try:
                element = await self.page.wait_for_selector(selector, state="visible", timeout=5000)
                if element:
                    await element.click()
                    await self._human_delay(500, 1000)
                    return True
            except PlaywrightTimeoutError:
                if attempt < retries - 1:
                    await asyncio.sleep(1)
                continue
        return False

    async def _type_text(self, selector: str, text: str, delay: int = 50) -> bool:
        """Type text into an input field with human-like delays."""
        try:
            await self.page.wait_for_selector(selector, state="visible", timeout=5000)
            await self.page.fill(selector, "")
            await self.page.type(selector, text, delay=delay)
            return True
        except PlaywrightTimeoutError:
            return False

    async def _scroll_to_element(self, selector: str) -> bool:
        """Scroll to make an element visible."""
        try:
            element = await self.page.wait_for_selector(selector, timeout=5000)
            if element:
                await element.scroll_into_view_if_needed()
                await self._human_delay(500, 1000)
                return True
        except PlaywrightTimeoutError:
            return False

    async def start_browser(self):
        """Launch browser with appropriate settings using persistent context."""
        self.playwright = await async_playwright().start()

        # Prepare browser launch arguments
        launch_args = [
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
        ]
        if self.settings.browser_minimized:
            launch_args.append("--start-minimized")

        # Use persistent context with a dedicated profile directory
        if self.settings.browser_user_data_dir:
            user_data_dir = self.settings.browser_user_data_dir
        else:
            # Create a dedicated profile directory for the bot
            bot_profile_dir = Path.home() / ".discord-raffle-bot" / "chrome-profile"
            bot_profile_dir.mkdir(parents=True, exist_ok=True)
            user_data_dir = str(bot_profile_dir)
            print(f"Using dedicated Chrome profile: {user_data_dir}")

        try:
            # Use persistent context to maintain login session
            # Add args to avoid conflicts with existing Chrome instances
            launch_args.extend(
                [
                    "--remote-debugging-port=0",  # Use random port to avoid conflicts
                    "--disable-extensions",  # Disable extensions for stability
                ]
            )

            self.context = await self.playwright.chromium.launch_persistent_context(
                user_data_dir=user_data_dir,
                headless=self.settings.browser_headless,
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                args=launch_args,
                ignore_default_args=["--enable-automation"],  # Remove automation flags
                channel=None,  # Don't use system Chrome, use Playwright's Chromium
            )
            self.using_persistent_context = True

            # Get or create a page
            if self.context.pages:
                self.page = self.context.pages[0]
            else:
                self.page = await self.context.new_page()

            print("Browser started successfully with persistent context")
            print("Note: This uses a separate browser profile, so your regular Chrome can stay open.")

        except Exception as e:
            print(f"Error starting persistent context: {e}")
            print("Falling back to regular browser launch...")
            # Fallback to regular launch
            self.browser = await self.playwright.chromium.launch(
                headless=self.settings.browser_headless,
                args=launch_args,
            )
            self.context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            )
            self.page = await self.context.new_page()
            self.using_persistent_context = False

        # Add stealth scripts to avoid detection
        await self.page.add_init_script(
            """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """
        )

    async def login_to_discord(self) -> bool:
        """Check if logged in to Discord, or navigate to Discord."""
        print("Navigating to Discord...")
        await self.page.goto("https://discord.com/app", wait_until="networkidle")
        await self._human_delay(2000, 3000)

        # Check if already logged in
        current_url = self.page.url
        if "channels" in current_url or "login" not in current_url:
            print("Already logged in to Discord!")
            return True

        print("Not logged in. Attempting login...")
        await self.page.goto("https://discord.com/login", wait_until="networkidle")
        await self._human_delay(2000, 3000)

        # If Discord credentials are not configured, fall back to manual login.
        if not self.settings.discord_email or not self.settings.discord_password:
            print("Discord email/password are not set in .env.")
            print("Please log in manually in the opened browser window; the bot will wait.")
            try:
                await self.page.wait_for_url("**/channels/**", timeout=120000)  # 2 minutes
                print("Login detected!")
                await self._human_delay(2000, 3000)
                return True
            except PlaywrightTimeoutError:
                print("Manual login was not detected in time.")
                return False

        # Automatic login using credentials from .env
        print("Entering email from .env...")
        email_selector = 'input[name="email"]'
        if not await self._wait_for_element(email_selector, timeout=10000):
            print("Could not find email field - may need manual login")
            print("Please log in manually in the browser, then the bot will continue...")
            try:
                await self.page.wait_for_url("**/channels/**", timeout=120000)  # 2 minutes
                print("Login detected!")
                return True
            except PlaywrightTimeoutError:
                return False

        await self._type_text(email_selector, self.settings.discord_email)
        await self._human_delay(500, 1000)

        print("Entering password from .env...")
        password_selector = 'input[name="password"]'
        if not await self._wait_for_element(password_selector, timeout=5000):
            print("Could not find password field")
            return False

        await self._type_text(password_selector, self.settings.discord_password)
        await self._human_delay(500, 1000)

        print("Clicking login button...")
        login_button = 'button[type="submit"]'
        if not await self._click_element(login_button):
            print("Could not click login button")
            return False

        print("Waiting for login to complete (or 2FA prompt)...")
        print("If 2FA is required, please complete it manually in the browser...")
        try:
            await self.page.wait_for_url("**/channels/**", timeout=120000)  # 2 minutes for 2FA
            await self._human_delay(2000, 3000)
            print("Login successful!")
            return True
        except PlaywrightTimeoutError:
            print("Login timeout - please check if 2FA or captcha is required")
            return False

    async def navigate_to_channel_url(self, channel_url: str, channel_name: str) -> bool:
        """Navigate directly to a Discord channel using its URL."""
        print(f"Navigating to channel: {channel_name}")
        print(f"URL: {channel_url}")

        try:
            await self.page.goto(channel_url, wait_until="networkidle", timeout=30000)
            await self._human_delay(2000, 3000)

            current_url = self.page.url
            if "discord.com/channels" in current_url:
                print(f"Successfully navigated to {channel_name}")
                return True
            else:
                print(f"Navigation may have failed. Current URL: {current_url}")
                return False
        except Exception as e:
            print(f"Error navigating to channel URL: {e}")
            return False

    async def is_raffle_ended(self, button_element) -> bool:
        """
        Check if a raffle has ended by looking at the raffle card/description
        around the button itself (e.g. the 'Ended January 27, 2026...' text),
        not Alphabot replies at the bottom of the channel.
        """
        try:
            raffle_text = await button_element.evaluate(
                """
                (el) => {
                    // Walk up through ancestors and accumulate text. This is more
                    // robust than relying on specific Discord class names.
                    let text = '';
                    let current = el;
                    let depth = 0;

                    while (current && depth < 8) {
                        if (current.textContent) {
                            text += ' ' + current.textContent;
                        }
                        current = current.parentElement;
                        depth += 1;
                    }

                    return text.toLowerCase();
                }
            """
            )

            if not raffle_text:
                return False

            # Typical ended text includes "ago". Exclude future phrases.
            if "ends in" in raffle_text or "ending in" in raffle_text:
                return False

            if "ago" not in raffle_text:
                return False

            if "ended" in raffle_text:
                return True

            if "ends" in raffle_text and "ago" in raffle_text:
                return True

            return False
        except Exception as e:
            print(f"Error checking if raffle ended: {e}")
            return False

    async def find_and_click_all_raffles(self) -> int:
        """Find and click all raffle buttons in the current channel, scrolling bottom to top."""
        print("Looking for raffle buttons (scanning from bottom to top)...")

        raffle_selectors = self.config.get(
            "raffle_button_selectors",
            ["button:has-text('Enter Raffle')"],
        )

        clicked_count = 0
        processed_buttons = set()

        print("Scrolling to bottom (newest messages)...")
        await self._human_delay(3000, 4000)

        print("Pressing End key to jump to bottom...")
        await self.page.keyboard.press("End")
        await self._human_delay(2000, 3000)

        scroll_result = await self.page.evaluate(
            """
            (function() {
                // Find Discord's main message container
                const selectors = [
                    'div[class*="scroller"][role="log"]',
                    '[class*="scrollerInner"]',
                    '[class*="messagesWrapper"]',
                    '[class*="scroller"]',
                    '[class*="messageContainer"]'
                ];

                for (let selector of selectors) {
                    const containers = document.querySelectorAll(selector);
                    for (let container of containers) {
                        if (container.scrollHeight > container.clientHeight) {
                            const oldScroll = container.scrollTop;
                            container.scrollTop = container.scrollHeight;
                            if (container.scrollTop > oldScroll || container.scrollTop === container.scrollHeight) {
                                return {
                                    scrolled: true,
                                    scrollTop: container.scrollTop,
                                    scrollHeight: container.scrollHeight,
                                    selector: selector
                                };
                            }
                        }
                    }
                }
                return { scrolled: false, scrollTop: 0, scrollHeight: 0, selector: 'none' };
            })();
        """
        )

        if scroll_result and scroll_result.get("scrolled"):
            print(f"  → Scrolled container: {scroll_result.get('selector')}")

        await self._human_delay(2000, 3000)

        print("Verifying we're at the bottom (this may take a moment)...")
        previous_scroll_top = -1
        scroll_attempts = 0
        max_scroll_attempts = 30

        while scroll_attempts < max_scroll_attempts:
            scroll_info = await self.page.evaluate(
                """
                (function() {
                    const selectors = [
                        'div[class*="scroller"][role="log"]',
                        '[class*="scrollerInner"]',
                        '[class*="messagesWrapper"]'
                    ];

                    for (let selector of selectors) {
                        const container = document.querySelector(selector);
                        if (container && container.scrollHeight > container.clientHeight) {
                            return {
                                scrollTop: container.scrollTop,
                                scrollHeight: container.scrollHeight,
                                clientHeight: container.clientHeight,
                                atBottom: container.scrollTop + container.clientHeight >= container.scrollHeight - 10
                            };
                        }
                    }
                    return null;
                })();
            """
            )

            if scroll_info and scroll_info.get("atBottom"):
                print(
                    f"Confirmed at bottom! Scroll position: {scroll_info.get('scrollTop')}/{scroll_info.get('scrollHeight')}"
                )
                break

            if scroll_info:
                await self.page.evaluate(
                    """
                    (function() {
                        const selectors = [
                            'div[class*="scroller"][role="log"]',
                            '[class*="scrollerInner"]',
                            '[class*="messagesWrapper"]'
                        ];

                        for (let selector of selectors) {
                            const container = document.querySelector(selector);
                            if (container) {
                                container.scrollTop = container.scrollHeight;
                                return true;
                            }
                        }
                        return false;
                    })();
                """
                )

                await self.page.keyboard.press("End")
                await self._human_delay(1500, 2000)

                current_scroll_top = scroll_info.get("scrollTop", 0)
                if current_scroll_top == previous_scroll_top and scroll_attempts >= 5:
                    print("No more scrolling possible, at bottom")
                    break

                previous_scroll_top = current_scroll_top
            else:
                await self.page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
                await self._human_delay(1000, 1500)

            scroll_attempts += 1

        final_check = await self.page.evaluate(
            """
            (function() {
                const container = document.querySelector('div[class*="scroller"][role="log"]') ||
                                 document.querySelector('[class*="scrollerInner"]');
                if (container) {
                    return {
                        atBottom: container.scrollTop + container.clientHeight >= container.scrollHeight - 10,
                        scrollTop: container.scrollTop,
                        scrollHeight: container.scrollHeight
                    };
                }
                return { atBottom: false };
            })();
        """
        )

        if final_check and final_check.get("atBottom"):
            print(f"✓ Successfully scrolled to bottom! (attempts: {scroll_attempts})")
        else:
            print("⚠ Warning: May not be at absolute bottom. Continuing anyway...")

        await self._human_delay(2000, 3000)

        print("\nProcessing raffles one by one from newest to oldest...")
        max_scrolls = 30
        scroll_count = 0
        consecutive_no_raffles = 0

        while scroll_count < max_scrolls:
            found_raffle = False

            for selector in raffle_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)

                    for element in reversed(elements):
                        if not await element.is_visible():
                            continue

                        try:
                            raw_text = await element.inner_text()
                        except Exception:
                            continue

                        button_text = (raw_text or "").strip()
                        text_lower = button_text.lower()

                        if "enter raffle" not in text_lower:
                            continue

                        try:
                            button_id = await element.evaluate(
                                """
                                (el) => {
                                    let message = el.closest('[class*="message"]');
                                    let msgId = message ? (message.id || message.getAttribute('data-message-id') || '') : '';
                                    let snippet = '';
                                    if (message && message.textContent) {
                                        snippet = message.textContent.trim().slice(0, 80);
                                    }
                                    return msgId + '|' + snippet;
                                }
                            """
                            )

                            if button_id in processed_buttons:
                                continue
                        except Exception:
                            continue

                        if await self.is_raffle_ended(element):
                            print(
                                "  → Encountered an already-ended raffle in history; stopping scan for this channel."
                            )
                            return clicked_count

                        found_raffle = True
                        processed_buttons.add(button_id)

                        await element.scroll_into_view_if_needed()
                        await self._human_delay(500, 1000)

                        try:
                            print(f"  → Attempting to click raffle with mouse: '{button_text[:60]}...'")

                            await element.scroll_into_view_if_needed()
                            await self._human_delay(300, 600)

                            try:
                                await element.evaluate(
                                    "(el) => { el.style.outline = '3px solid red'; el.style.outlineOffset = '2px'; }"
                                )
                            except Exception:
                                pass

                            bbox = await element.bounding_box()
                            if not bbox:
                                print("  ✗ Could not get button bounding box; skipping.")
                                continue

                            target_x = bbox["x"] + bbox["width"] / 2
                            target_y = bbox["y"] + bbox["height"] / 2

                            await self.page.mouse.move(target_x, target_y, steps=10)
                            await self._human_delay(100, 250)
                            await self.page.mouse.click(target_x, target_y)
                            await self._human_delay(150, 300)
                            await self.page.mouse.click(target_x, target_y)

                            clicked_count += 1
                            print(f"  ✓ Mouse click sent to raffle #{clicked_count}.")

                            delay_seconds = random.uniform(
                                self.settings.raffle_click_delay_min / 1000,
                                self.settings.raffle_click_delay_max / 1000,
                            )
                            print(f"  Waiting {delay_seconds:.1f} seconds...")
                            await asyncio.sleep(delay_seconds)

                            break
                        except Exception as e:
                            print(f"  ✗ Could not click raffle button: {e}")
                            continue

                    if found_raffle:
                        break

                except Exception:
                    continue

            if found_raffle:
                consecutive_no_raffles = 0
                print("  Scrolling up to look for the next raffle (PageUp)...")
                await self.page.keyboard.press("PageUp")
                await self._human_delay(1200, 1800)
            else:
                consecutive_no_raffles += 1
                if consecutive_no_raffles >= 3:
                    print("  No more raffles found - moving to next channel")
                    break

                print("  No raffle in current viewport, scrolling further up (PageUp)...")
                await self.page.keyboard.press("PageUp")
                await self._human_delay(1200, 1800)

            scroll_count += 1

        print(f"Finished scanning channel. Clicked {clicked_count} raffle(s).")
        return clicked_count

    async def process_channel(self, channel_config: dict) -> bool:
        """Process a single channel. Returns True if should continue, False if ended raffle found."""
        channel_name = channel_config.get("name", "Unknown")
        channel_url = channel_config.get("url")

        if not channel_url:
            print(f"Skipping {channel_name} - no URL provided")
            try:
                self.stats["channels_skipped_no_url"] += 1
                self.stats.setdefault("channels", []).append(
                    {"name": channel_name, "clicked": 0, "reason": "no_url"}
                )
            except Exception:
                pass
            return True

        print(f"\n--- Processing channel: {channel_name} ---")

        if await self.navigate_to_channel_url(channel_url, channel_name):
            await self._human_delay(2000, 3000)

            result = await self.find_and_click_all_raffles()

            try:
                clicked = max(result or 0, 0)
                self.stats.setdefault("channels", []).append(
                    {"name": channel_name, "clicked": clicked, "reason": "processed"}
                )
                self.stats["total_raffles_clicked"] += clicked
                if clicked > 0:
                    self.stats["channels_with_raffles"] += 1
                else:
                    self.stats["channels_without_raffles"] += 1
                self.stats["channels_processed"] += 1
            except Exception:
                pass

            if result == -1:
                print("Ended raffle detected, moving to next channel...")
                return False

            return True
        else:
            print(f"Could not access channel: {channel_name}")
            return True

    def _get_stats_file_path(self) -> Path:
        """Determine where to persist the last run statistics."""
        env_path = os.getenv("RAFFLE_STATS_FILE")
        if env_path:
            return Path(env_path).expanduser()

        project_root = Path(__file__).resolve().parent.parent
        return project_root / "last_run_stats.json"

    def _save_stats(self) -> None:
        """Persist the current in-memory statistics to a JSON file (best-effort)."""
        try:
            stats = dict(self.stats or {})
            stats["finished_at_utc"] = datetime.now(timezone.utc).isoformat()

            path = self._get_stats_file_path()
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(stats, indent=2), encoding="utf-8")
            print(f"Saved run statistics to {path}")
        except Exception as e:
            print(f"Could not save stats: {e}")

    async def run(self):
        """Main execution loop."""
        try:
            print("Starting Discord Raffle Bot...")
            await self.start_browser()
            print("Browser started")

            if not await self.login_to_discord():
                print("Failed to login to Discord")
                return

            channels = self.config.get("channels", [])

            if not channels:
                servers = self.config.get("servers", [])
                channels = []
                for server in servers:
                    server_name = server.get("name", "")
                    for channel_name in server.get("channels", []):
                        channels.append(
                            {"name": f"{server_name} - {channel_name}", "url": None}
                        )

            for idx, channel_config in enumerate(channels):
                channel_name = channel_config.get("name", f"Channel {idx + 1}")

                if idx == 0:
                    try:
                        self.stats["total_channels"] = len(channels)
                        self.stats["channels_processed"] = 0
                        self.stats["channels_with_raffles"] = 0
                        self.stats["channels_without_raffles"] = 0
                        self.stats["channels_skipped_no_url"] = 0
                        self.stats["total_raffles_clicked"] = 0
                        self.stats["channels"] = []
                    except Exception:
                        pass

                print(f"\n{'='*60}")
                print(f"Processing channel: {channel_name} ({idx + 1}/{len(channels)})")
                print(f"{'='*60}")

                should_continue = await self.process_channel(channel_config)

                if not should_continue:
                    print("Moving to next channel due to ended raffle...")

                if idx < len(channels) - 1:
                    delay_seconds = random.uniform(
                        self.settings.server_delay_min / 1000,
                        self.settings.server_delay_max / 1000,
                    )
                    print(f"\nWaiting {delay_seconds:.1f} seconds before next channel...")
                    await asyncio.sleep(delay_seconds)

            print("\n" + "=" * 60)
            print("Bot execution completed!")
            print("Browser will remain open. Press Ctrl+C to exit.")
            print("=" * 60)

            try:
                self._save_stats()
            except Exception:
                pass

            while True:
                await asyncio.sleep(60)

        except KeyboardInterrupt:
            print("\nShutting down...")
        except Exception as e:
            print(f"Error: {e}")
            import traceback

            traceback.print_exc()
        finally:
            try:
                if self.context:
                    if self.using_persistent_context:
                        print("Closing browser context...")
                        await self.context.close()
                    elif self.browser:
                        await self.browser.close()

                if self.playwright:
                    await self.playwright.stop()

            except Exception as e:
                print(f"Error during cleanup: {e}")

