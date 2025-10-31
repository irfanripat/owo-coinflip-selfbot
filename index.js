require('dotenv').config()
const { Client } = require('discord.js-selfbot-v13');
const config = require('./config.json')
const strategies = require('./coinflipStrategies')
const readline = require('readline')
const chalk = require('chalk');

// Big colorful ASCII art welcome UI
console.log('');
console.log(chalk.cyanBright('██████  ███████ ██████  ████████  ██████  ██████   █████  ████████ ██       █████  ██   ██ '));
console.log(chalk.cyanBright('██   ██ ██      ██   ██    ██    ██    ██ ██   ██ ██   ██    ██    ██      ██   ██ ██   ██ '));
console.log(chalk.cyanBright('██████  █████   ██████     ██    ██    ██ ██████  ███████    ██    ██      ███████ ███████ '));
console.log(chalk.cyanBright('██   ██ ██      ██   ██    ██    ██    ██ ██   ██ ██   ██    ██    ██      ██   ██ ██   ██ '));
console.log(chalk.cyanBright('██████  ███████ ██   ██    ██     ██████  ██████  ██   ██    ██    ███████ ██   ██ ██   ██ '));
console.log(chalk.cyanBright('                                                                                           '));
console.log(chalk.cyanBright('                                                                                           '));
console.log(chalk.yellowBright('Coinflip Selfbot - Automated betting strategies for OwO bot'));
console.log(chalk.redBright("If this bot wins, thank Ippang. If it loses, blame Copilot."));
console.log('');

// Config
const TOKEN = JSON.parse(process.env.TOKEN)
const reportChannelId = config.reportChannelId || config.channelId
const authorId = config.id;
const OWO_BOT_ID = '408785106942164992';

// Anticipate that the commands are not running at the same time
const random = (number = 10) => {
    return Math.floor(Math.random() * number)
}

// Can run many bots depending on device capacity

// Prompt user to select strategy at startup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const strategyMap = [
  { key: 'martingale', label: 'Martingale (double after loss, reset after win)' },
  { key: 'reverseMartingale', label: 'Reverse Martingale (double after win, reset after loss)' },
  { key: 'hybrid', label: 'Hybrid (adaptive, streak-based, side switching)' }
];
console.log('Available coinflip strategies:');
strategyMap.forEach((s, idx) => {
  console.log(`${idx + 1}. ${s.label}`);
});

function askInitialBet() {
  rl.question('Enter initial bet amount (1 - 250000): ', (betInput) => {
    const initialBet = parseInt(betInput);
    if (isNaN(initialBet) || initialBet < 1 || initialBet > 250000) {
      console.log('❌ Invalid bet. Please enter a number between 1 and 250000.');
      return askInitialBet();
    }
    askTargetProfit(initialBet);
  });
}

function askTargetProfit(initialBet) {
  rl.question('Enter target profit (positive integer): ', (profitInput) => {
    const targetProfit = parseInt(profitInput);
    if (isNaN(targetProfit) || targetProfit < 1) {
      console.log('❌ Invalid profit. Please enter a positive integer.');
      return askTargetProfit(initialBet);
    }
    askStrategy(initialBet, targetProfit);
  });
}

function askStrategy(initialBet, targetProfit) {
  rl.question('Select strategy number to run: ', (answer) => {
    const idx = parseInt(answer) - 1;
    const strategyObj = strategyMap[idx];
    if (!strategyObj) {
      console.log('Invalid selection. Exiting.');
      rl.close();
      process.exit(1);
    }
    const strategy = strategies[strategyObj.key];
    rl.close();

    // Calculate max bet and max attempts for martingale
    const maxBet = 250000;
    let maxAttempts = 7;
    if (strategyObj.key === 'martingale') {
      maxAttempts = Math.floor(Math.log(maxBet / initialBet) / Math.log(2)) + 1;
      console.log(`Martingale max attempts before reset: ${maxAttempts}`);
    }

    for (const token of TOKEN) {
      let statusBot = true;
      let statusAfk = false;
      let channelId = token.split('xxxxx')[1] || config.channelId;

      const client = new Client({ checkUpdate: false });
      client.login(token.split('xxxxx')[0]);

      client.on('ready', async () => {
        console.log(`(${client.user.tag}) ready for coinflip strategy: ${strategyObj.label}`);
        if (strategyObj.key === 'martingale') {
          strategy(client, channelId, initialBet, maxBet, targetProfit, maxAttempts);
        } else {
          strategy(client, channelId, initialBet, maxBet, targetProfit);
        }
      });

      // ...existing messageCreate handler...
      client.on('messageCreate', async (msg) => {
        // ...existing code...
        // ...existing code...
      });
    }
  });
}

askInitialBet();