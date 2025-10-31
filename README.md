#

Automated coinflip betting for the OwO Discord bot using a martingale strategy.

## Features
- Automatically sends coinflip commands to the OwO bot
- Waits for the bot's reply and its edit to determine win/loss
- Uses martingale betting: doubles bet after each loss, resets after win or max attempts
- Configurable base bet, max bet, and profit goal

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/owo-coinflip-selfbot.git
   cd owo-coinflip-selfbot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   - Copy `.env.example` to `.env` and fill in your Discord token(s):
     ```bash
     cp .env.example .env
     # Edit .env and set your token(s)
     ```
   - Edit `config.json` and set your Discord user ID and target channel ID.

4. **Run the bot:**
   ```bash
   npm start
   ```

## How It Works

1. The bot sends a coinflip command (`w coinflip <bet> <side>`) to the specified channel.
2. It waits for the OwO bot's reply message, then waits for that message to be edited with the final result.
3. If the result is a win, it resets the bet to the base amount. If it's a loss, it doubles the bet (up to the max bet).
4. The process repeats, with a random delay between 15–20 seconds after each coinflip.
5. When the profit goal is reached, the bot cools down for 5 minutes before restarting.

## Strategy

- **Martingale:** After each loss, the bet is doubled to recover previous losses. After a win or reaching the max attempts, the bet resets to the base amount.
- **Profit Goal:** When the net profit reaches the configured goal, the bot pauses for a cooldown period.

## Coinflip Strategies

- **Martingale**: After each loss, the bet is doubled to recover previous losses. After a win or reaching the max attempts, the bet resets to the initial amount. This strategy aims to recover all previous losses with a single win, but can quickly reach the max bet limit if you hit a losing streak.

- **Reverse Martingale**: After each win, the bet is doubled to maximize profit during a winning streak. After a loss or reaching a 2-win streak, the bet resets to the initial amount. This strategy tries to capitalize on consecutive wins while minimizing losses.

- **Hybrid**: An adaptive strategy that doubles the bet after a win (like Reverse Martingale), resets after two wins, switches sides after three consecutive losses, and randomly switches sides after a single loss. This approach attempts to balance risk and adapt to streaks, potentially reducing the impact of long losing streaks.

## How to Get Your Discord Token

> **Warning:** Never share your Discord token. Keep it private and secure.

### Using Browser Console

1. Open Discord in your browser (not the app).
2. Press `Ctrl + Shift + I` to open Developer Tools.
3. Go to the `Console` tab.
4. Paste and run the following code:

```js
window.webpackChunkdiscord_app.push([
    [Symbol()],
    {},
    req => {
        if (!req.c) return;
        for (let m of Object.values(req.c)) {
            try {
                if (!m.exports || m.exports === window) continue;
                if (m.exports?.getToken) return copy(m.exports.getToken());
                for (let ex in m.exports) {
                    if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
                }
            } catch {}
        }
    },
]);

window.webpackChunkdiscord_app.pop();
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```

5. Your Discord token will be copied to your clipboard.

> **Note:** Use your token only for personal/selfbot projects. Never share it or use it in public bots.

## Configuring `config.json`

1. Copy the example config file:
   ```bash
   cp config.example.json config.json
   ```
2. Edit `config.json` and fill in your Discord user and channel IDs:

```json
{
  "id": "your_discord_user_id",
  "channelId": "your_channel_id",
  "reportChannelId": "your_report_channel_id"
}
```

- `id`: Your Discord user ID. This is the account that will run the selfbot.
- `channelId`: The Discord channel ID where coinflip commands will be sent.
- `reportChannelId`: (Optional) The channel ID where reports or logs will be sent. If not set, it defaults to `channelId`.

> You can get your user and channel IDs by enabling Developer Mode in Discord (User Settings > Advanced > Developer Mode), then right-clicking on your profile or a channel and selecting "Copy ID".

---

## References

- [Martingale Strategy (Wikipedia)](https://en.wikipedia.org/wiki/Martingale_(betting_system))
- [Reverse Martingale / Paroli System (Wikipedia)](https://en.wikipedia.org/wiki/Paroli_system)

---

## Disclaimer

This project is for educational purposes only. Use at your own risk. Automated selfbots may violate Discord's Terms of Service.