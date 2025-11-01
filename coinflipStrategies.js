
// coinflipStrategies.js
// Multiple coinflip strategies for OwO bot selfbot
// Each strategy is a function with the same signature as autoCoinFlip

const { sleep, randomSide, getCoinflipResult, randomInt } = require('./utils');





/**
 * Martingale strategy: double bet after loss, reset after win or max attempts
 */
async function martingale(client, channelId, baseBet = 1, maxBet = 1000, profitGoal = 400, maxAttempts = 7, chosenSide = 'random') {
  let attempt = 1, currentBet = baseBet, totalIncome = 0, totalFlips = 0;
  const startTime = Date.now();
  console.log(`🎮 Starting Martingale strategy with base bet ${baseBet}, max attempts before reset: ${maxAttempts}`);
  while (true) {
    if (totalIncome >= profitGoal) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`🎉 Target profit reached: ${totalIncome}. Stopping bot.`);
      console.log(`⏱️ Duration to reach profit: ${duration} seconds.`);
      process.exit(0);
    }
    const currentSide = (chosenSide === 'random') ? randomSide() : chosenSide;
    console.log(`🪙 Attempt ${attempt} | Bet: ${currentBet} | Side: ${currentSide}`);
    const resultMsg = await getCoinflipResult(client, channelId, currentBet, currentSide);
    totalFlips++;
    if (!resultMsg) { console.log('⚠️ No result, retrying...'); continue; }
    if (/you won/i.test(resultMsg.content)) {
      totalIncome += currentBet;
      console.log(`✅ You WON! (+${currentBet}) | 💰 Current income: ${totalIncome}`);
      attempt = 1;
      currentBet = baseBet;
    } else if (/you lost/i.test(resultMsg.content)) {
      totalIncome -= currentBet;
      console.log(`❌ You LOST! (-${currentBet}) | 💰 Current income: ${totalIncome}`);
        console.log(`⏳ Lost this round. Waiting before next coinflip...`);
      if (attempt >= maxAttempts) {
        console.log("🚫 Max attempts reached — resetting bet.");
        attempt = 1;
        currentBet = baseBet;
      } else {
        attempt++;
        currentBet = Math.min(currentBet * 2, maxBet);
      }
    }
    if (totalFlips % 20 === 0) {
      console.log(`📊 Stats → Total flips: ${totalFlips} | Total income: ${totalIncome}`);
    }
    await sleep(randomInt(15000, 20001));
  }
}



/**
 * Reverse Martingale: double bet after win, reset after loss or 2-win streak
 */
async function reverseMartingale(client, channelId, baseBet = 1, maxBet = 1000, profitGoal = 400, winStreakLimit = 2, chosenSide = 'random') {
  let currentBet = baseBet, currentStreak = 0, totalIncome = 0, totalFlips = 0;
  const startTime = Date.now();
  console.log(`🎮 Starting Reverse Martingale strategy with base bet ${baseBet}, reset after ${winStreakLimit} consecutive wins`);
  while (true) {
    if (totalIncome >= profitGoal) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`🎉 Target profit reached: ${totalIncome}. Stopping bot.`);
      console.log(`⏱️ Duration to reach profit: ${duration} seconds.`);
      process.exit(0);
    }
  const currentSide = (chosenSide === 'random') ? randomSide() : chosenSide;
    console.log(`🪙 Flip #${totalFlips + 1} | Bet: ${currentBet} | Side: ${currentSide}`);
    const resultMsg = await getCoinflipResult(client, channelId, currentBet, currentSide);
    totalFlips++;
    if (!resultMsg) { console.log('⚠️ No result, retrying...'); continue; }
    if (/you won/i.test(resultMsg.content)) {
      currentStreak++;
      totalIncome += currentBet;
      console.log(`✅ WIN | +${currentBet} | Streak: ${currentStreak} | Total: ${totalIncome}`);
      if (currentStreak >= winStreakLimit) {
        console.log(`🏆 ${winStreakLimit}-win streak reached! Resetting to base bet.`);
        currentStreak = 0;
        currentBet = baseBet;
      } else {
        currentBet = Math.min(currentBet * 2, maxBet);
      }
    } else if (/you lost/i.test(resultMsg.content)) {
      totalIncome -= currentBet;
  console.log(`❌ LOSS | -${currentBet}) | Streak ended. | Total: ${totalIncome}`);
  console.log(`⏳ Lost this round. Preparing for the next flip...`);
      currentStreak = 0;
      currentBet = baseBet;
    }
    if (totalFlips % 20 === 0) {
      console.log(`📊 Stats → Total flips: ${totalFlips} | Total income: ${totalIncome}`);
    }
    await sleep(randomInt(15000, 20001));
  }
}



/**
 * Hybrid strategy: double after win, reset after 2 wins, switch side after 3 losses, random switch after single loss
 */
async function hybrid(client, channelId, baseBet = 1, maxBet = 1000, profitGoal = 400) {
  let currentBet = baseBet, winStreak = 0, loseStreak = 0, totalIncome = 0, totalFlips = 0;
  let currentSide = randomSide();
  const startTime = Date.now();
  console.log(`🎮 Starting Hybrid strategy with base bet ${baseBet}`);
  while (true) {
    if (totalIncome >= profitGoal) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`🎉 Target profit reached: ${totalIncome}. Stopping bot.`);
      console.log(`⏱️ Duration to reach profit: ${duration} seconds.`);
      process.exit(0);
    }
    console.log(`🪙 Flip #${totalFlips + 1} | Bet: ${currentBet} | Side: ${currentSide}`);
    const resultMsg = await getCoinflipResult(client, channelId, currentBet, currentSide);
    totalFlips++;
    if (!resultMsg) { console.log('⚠️ No result, retrying...'); continue; }
    if (/you won/i.test(resultMsg.content)) {
      winStreak++;
      loseStreak = 0;
      totalIncome += currentBet;
      console.log(`✅ WIN | +${currentBet} | WinStreak: ${winStreak} | Total: ${totalIncome}`);
      currentBet = Math.min(currentBet * 2, maxBet);
      if (winStreak >= 2) {
        console.log(`🏆 2 consecutive wins → securing profit & resetting bet.`);
        winStreak = 0;
        currentBet = baseBet;
      }
      // Keep same side on win
    } else if (/you lost/i.test(resultMsg.content)) {
      loseStreak++;
      winStreak = 0;
      totalIncome -= currentBet;
      console.log(`❌ LOSS | -${currentBet}) | LoseStreak: ${loseStreak} | Total: ${totalIncome}`);
      currentBet = baseBet;
      // Switch side after 3 consecutive losses
      if (loseStreak >= 3) {
        currentSide = currentSide === 'h' ? 't' : 'h';
        loseStreak = 0;
        console.log(`🔁 Switched side after 3 losses → Now betting on "${currentSide.toUpperCase()}"`);
      } else if (Math.random() < 0.3) {
        currentSide = currentSide === 'h' ? 't' : 'h';
        console.log(`🎲 Random side switch → Now "${currentSide.toUpperCase()}"`);
      } else {
        console.log(`🧍 Keeping same side "${currentSide}"`);
          console.log(`⏳ Lost this round. Taking a short break before the next attempt...`);
      }
    }
    if (totalFlips % 20 === 0) {
      console.log(`📊 Stats → Total flips: ${totalFlips} | Total income: ${totalIncome}`);
    }
    await sleep(randomInt(15000, 20001));
  }
}

module.exports = {
  martingale,
  reverseMartingale,
  hybrid,
};
