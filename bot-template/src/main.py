"""Main entry point for Discord Raffle Bot."""

import asyncio
from .bot import DiscordRaffleBot


async def main():
    """Run the Discord raffle bot."""
    bot = DiscordRaffleBot()
    await bot.run()


if __name__ == "__main__":
    asyncio.run(main())

