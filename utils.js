// utils.js
// Shared utility functions for OwO coinflip selfbot


/**
 * Return a random integer between min (inclusive) and max (exclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Sleep for ms milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get a random side ('h' or 't')
 */
function randomSide() {
  return Math.random() < 0.5 ? 'h' : 't';
}

/**
 * Wait for OwO bot reply and edit with result
 */
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

async function getCoinflipResult(client, channelId, currentBet, currentSide) {
  const OWO_BOT_ID = '408785106942164992';
  const channel = client.channels.cache.get(channelId);
  // Send coinflip command and wait for reply
  let verificationPause = false;
  const verificationListener = (msg) => {
    if (
      msg.channel.id === channelId &&
      msg.author.id === OWO_BOT_ID &&
      /are you a real human|please complete this within/i.test(msg.content)
    ) {
      console.log('⚠️ OwO sent human verification! Pausing strategy until you verify.');
      verificationPause = true;
    }
  };
  client.on('messageCreate', verificationListener);

  const timeSent = Date.now();
  let firstMsg;
  const firstMsgPromise = new Promise((resolve) => {
    const listener = (msg) => {
      if (msg.channel.id === channelId && msg.author.id === OWO_BOT_ID) {
        client.off('messageCreate', listener);
        resolve(msg);
      }
    };
    client.on('messageCreate', listener);
    channel.send(`w coinflip ${currentBet} ${currentSide}`);
    setTimeout(() => {
      client.off('messageCreate', listener);
      resolve(undefined);
    }, 15000);
  });
  firstMsg = await firstMsgPromise;
  if (verificationPause) {
    // Pause until user verifies (wait for any message from user in channel)
    await new Promise((resolve) => {
      console.log('⏸️ Waiting for human verification...');
      const resumeListener = (msg) => {
        if (msg.channel.id === channelId && !msg.author.bot) {
          client.off('messageCreate', resumeListener);
          resolve();
        }
      };
      client.on('messageCreate', resumeListener);
    });
    verificationPause = false;
    client.off('messageCreate', verificationListener);
    console.log('✅ Human verification complete. Resuming strategy.');
    return undefined;
  }
  client.off('messageCreate', verificationListener);
  if (!firstMsg) return undefined;

  // Wait for edit with result
  let resultMsg;
  let timeReply = null;
  const editPromise = new Promise((resolve) => {
    const editListener = (oldMsg, newMsg) => {
      if (
        newMsg.id === firstMsg.id &&
        newMsg.channel?.id === channelId &&
        !newMsg.partial &&
        (/you won/i.test(newMsg.content) || /you lost/i.test(newMsg.content))
      ) {
        client.off('messageUpdate', editListener);
        timeReply = Date.now();
        resolve(newMsg);
      }
    };
    client.on('messageUpdate', editListener);
    setTimeout(() => {
      client.off('messageUpdate', editListener);
      resolve(undefined);
    }, 15000);
  });
  resultMsg = await editPromise;

  // Optional logging
  if (config.logging && config.logging.enabled && resultMsg) {
    const logFile = path.resolve(config.logging.file || 'coinflip_log.csv');
    const duration = timeReply ? (timeReply - timeSent) : '';
    const result = /you won/i.test(resultMsg.content) ? 'win' : (/you lost/i.test(resultMsg.content) ? 'loss' : 'unknown');
    const winSide = currentSide;
    const logRow = `${new Date(timeSent).toISOString()},${new Date(timeReply).toISOString()},${currentBet},${winSide},${result},${duration}\n`;
    // Write header if file does not exist
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, 'time_sent,time_reply,bet,side,result,duration_ms\n', { flag: 'w' });
    }
    fs.appendFileSync(logFile, logRow, { flag: 'a' });
  }

  return resultMsg;
}

module.exports = {
  sleep,
  randomSide,
  getCoinflipResult,
  randomInt,
};
