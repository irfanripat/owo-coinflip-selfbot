
// Coinflip strategy for OwO bot selfbot
// This script automates coinflip betting using a martingale strategy.
// It waits for the OwO bot's reply and its edit to determine win/loss.
// Author: [Your Name]
// Date: 2025-10-31

const { randomInt } = require('crypto');

async function awaitResponse(client, channel, filter, {
  time = 15000,
  watchEdits = false,
  trigger,
  expectResponse = false
} = {}) {
  return new Promise((resolve, reject) => {
    let timeout;
    const cleanup = () => {
      client.off('messageCreate', messageListener);
      client.off('messageUpdate', editListener);
      clearTimeout(timeout);
    };
    const resolveWith = (message) => {
      cleanup();
      resolve(message);
    };
    const messageListener = (message) => {
      if (message.channel.id === channel.id && filter(message)) {
        resolveWith(message);
      }
    };
    const editListener = (oldMessage, newMessage) => {
      if (
        watchEdits &&
        newMessage.channel?.id === channel.id &&
        !newMessage.partial &&
        filter(newMessage)
      ) {
        resolveWith(newMessage);
      }
    };
    client.on('messageCreate', messageListener);
    if (watchEdits) client.on('messageUpdate', editListener);
    timeout = setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, time);
    if (typeof trigger === 'function') trigger();
  });
}


/**
 * Runs the auto coinflip strategy using martingale betting.
 * @param {Client} client - Discord.js client instance
 * @param {string} channelId - Channel ID to send coinflip commands
 * @param {number} baseBet - Starting bet amount
 * @param {number} maxBet - Maximum bet allowed
 * @param {number} profitGoal - Profit target before cooldown
 */
async function autoCoinFlip(client, channelId, baseBet = 1, maxBet = 1000, profitGoal = 400) {
  let attempt = 1; // Current attempt in martingale sequence
  let currentBet = baseBet; // Current bet amount
  let totalIncome = 0; // Net profit/loss
  let totalFlips = 0; // Number of coinflips performed

  console.log(`🎮 Starting autoCoinFlip with base bet ${baseBet}`);

  while (true) {
    // Check if profit goal reached, then cooldown
    if (totalIncome >= profitGoal) {
      console.log(`💰 Profit reached ${totalIncome}. Cooling down for 5 minutes...`);
      await new Promise(r => setTimeout(r, 300000)); // 5 min cooldown
      totalIncome = 0;
      continue;
    }

    // Randomly choose heads or tails
    const currentSide = Math.random() < 0.5 ? 'h' : 't';
    console.log(`🪙 Attempt ${attempt} | Bet: ${currentBet} | Side: ${currentSide}`);

    // Send coinflip command to channel
    const channel = client.channels.cache.get(channelId);
    const owoId = '408785106942164992'; // OwO bot user ID

    // Listen for the first OwO bot message after sending coinflip
    let firstMsg;
    const firstMsgPromise = new Promise((resolve) => {
      const listener = (msg) => {
        if (msg.channel.id === channelId && msg.author.id === owoId) {
          client.off('messageCreate', listener);
          resolve(msg);
        }
      };
      client.on('messageCreate', listener);
      channel.send(`w coinflip ${currentBet} ${currentSide}`);
      setTimeout(() => {
        client.off('messageCreate', listener);
        resolve(undefined);
      }, 15000); // 15s timeout for bot reply
    });
    firstMsg = await firstMsgPromise;
    totalFlips++;
    if (firstMsg) {
      console.log(`📩 Received message: "${firstMsg.content}" from ${firstMsg.author?.tag || firstMsg.author?.id}`);
    } else {
      console.log('⚠️ No OwO bot reply, retrying...');
      continue;
    }

    // Wait for the message to be edited with the result
    let resultMsg;
    const editPromise = new Promise((resolve) => {
      const editListener = (oldMsg, newMsg) => {
        if (
          newMsg.id === firstMsg.id &&
          newMsg.channel?.id === channelId &&
          !newMsg.partial &&
          (/you won/i.test(newMsg.content) || /you lost/i.test(newMsg.content))
        ) {
          client.off('messageUpdate', editListener);
          resolve(newMsg);
        }
      };
      client.on('messageUpdate', editListener);
      setTimeout(() => {
        client.off('messageUpdate', editListener);
        resolve(undefined);
      }, 15000); // 15s timeout for edit
    });
    resultMsg = await editPromise;
    if (resultMsg) {
      console.log(`✏️ Message edited: "${resultMsg.content}"`);
    } else {
      console.log('⚠️ No edit with result, retrying...');
      continue;
    }

    // Check result and update stats
    if (/you won/i.test(resultMsg.content)) {
      totalIncome += currentBet;
      console.log(`✅ You WON! (+${currentBet}) | 💰 Current income: ${totalIncome}`);
      attempt = 1;
      currentBet = baseBet;
    } else if (/you lost/i.test(resultMsg.content)) {
      totalIncome -= currentBet;
      console.log(`❌ You LOST! (-${currentBet}) | 💰 Current income: ${totalIncome}`);
      if (attempt >= 7) {
        console.log("🚫 Max attempts reached — resetting bet.");
        attempt = 1;
        currentBet = baseBet;
      } else {
        attempt++;
        currentBet = Math.min(currentBet * 2, maxBet);
      }
    } else {
      console.log('⚠️ Edit did not contain result, retrying...');
      continue;
    }

    // Log stats every 20 flips
    if (totalFlips % 20 === 0) {
      console.log(`📊 Stats → Total flips: ${totalFlips} | Total income: ${totalIncome}`);
    }

    // Sleep for 15-20 seconds before next coinflip
    const sleepMs = randomInt(15000, 20001);
    console.log(`⏳ Sleeping for ${(sleepMs / 1000).toFixed(1)} seconds before next coinflip...`);
    await new Promise(r => setTimeout(r, sleepMs));
  }
}


// Export the autoCoinFlip function
module.exports = { autoCoinFlip };
