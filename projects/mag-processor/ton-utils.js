const { TonClient } = require('@ton/ton');
const { Address, toNano } = require('@ton/core');

const CONFIG = {
    // 已部署的合约
    CONTRACT_ADDRESS: "EQDdDkojazcx_uPxj6_M4TIad-TB3vvTxRwUz4s_4W9H0AmP",
    MAG_ADDRESS: "EQArReyjdldNhNl-81YrIJ2_bhuZrJSjXNBn5bzt4O46Zc29",
    LP_ADDRESS: "EQAx8hzs2ZJHE4Cf1y7zFOqVFei92SpbCJQGZjoTYXAxHE0t",
    LOTTERY_AMOUNT: toNano('0.1'),
    MAG_LOTTERY_AMOUNT: toNano('10'),  // 10 MAG
    LP_STAKE_AMOUNT: toNano('1'),      // 1 LP
    AUTO_BUY_THRESHOLD: toNano('2'),   // 2 TON
    AUTO_BUY_AMOUNT: toNano('1.5'),    // 1.5 TON
    MAG_LOTTERY_INTERVAL: 24 * 60 * 1000, // 24分钟
    MAG_REWARD_AMOUNT: toNano('10')    // LP质押奖励
};

// 初始化TON客户端
async function initTonClient() {
    return new TonClient({
        endpoint: 'https://mainnet.tonhubapi.com/jsonRPC'
    });
}

// 检查交易类型
function isLPTransfer(tx) {
    return tx?.inMessage?.value === CONFIG.LP_STAKE_AMOUNT.toString() && 
           tx?.inMessage?.source === CONFIG.LP_ADDRESS;
}

function isMagTransfer(tx) {
    return tx.inMessage?.value === CONFIG.MAG_LOTTERY_AMOUNT;
}

// 从截图看到的交易类型
async function analyzeTransaction(tx) {
    // 1 TON转入
    if (tx.value === toNano('1') && !tx.isJetton) {
        return { type: 'ton_transfer', amount: '1' };
    }
    
    // 0.1 TON转入
    if (tx.value === toNano('0.1') && !tx.isJetton) {
        return { type: 'lottery', amount: '0.1' };
    }
    
    // LP转入
    if (isLPTransfer(tx) && tx.value === toNano('1')) {
        return { type: 'stake', amount: '1LP' };
    }
    
    // MAG转入
    if (isMagTransfer(tx) && tx.value === toNano('1000')) {
        return { type: 'mag_lottery', amount: '1000MAG' };
    }
    
    return { type: 'unknown' };
}

// 获取哈希最后一位数字
function getLastNumber(hash) {
    const numbers = hash.match(/\d/g);
    return numbers ? numbers[numbers.length - 1] : '0';
}

// 计算哈希中所有数字之和
function sumHashNumbers(hash) {
    let sum = 0;
    for (let char of hash) {
        if (/\d/.test(char)) {  // 或者用 char.match(/\d/)
            sum += parseInt(char, 10);
        }
    }
    return sum;
}

// 生成TON抽奖奖励命令
function generateTonLotteryCommand(tx) {
    if (!tx || !tx.hash || !tx.sender) {
        throw new Error('Invalid transaction data');
    }
    return {
        type: 'MAG_TRANSFER',
        to: tx.sender,
        amount: calculateLotteryReward(tx.hash),
        timing: 'immediate'
    };
}

// 生成LP返还命令
function generateLPReturnCommand(tx) {
    if (!tx || !tx.sender || !tx.timestamp) {
        throw new Error('Invalid LP stake data');
    }
    return {
        type: 'LP_TRANSFER',
        to: tx.sender,
        amount: CONFIG.LP_STAKE_AMOUNT,
        timing: tx.timestamp + (3 * 60 * 1000) // 3分钟后
    };
}

// 生成MAG抽奖奖励命令
function generateMagLotteryCommand(entries) {
    if (!entries || !entries.length) {
        throw new Error('No lottery entries');
    }
    
    const winner = entries.reduce((max, current) => 
        current.number > max.number ? current : max
    );
    
    const totalPrize = entries.length * 10 * 0.9; // 每人10 MAG * 90%
    return {
        type: 'MAG_TRANSFER',
        to: winner.sender,
        amount: toNano(totalPrize.toString()),
        timing: 'immediate'
    };
}

// MAG抽奖定时器管理
let magLotteryInterval;

function startMagLottery() {
    if (magLotteryInterval) {
        clearInterval(magLotteryInterval);
    }
    magLotteryInterval = setInterval(processMagLottery, CONFIG.MAG_LOTTERY_INTERVAL);
}

function stopMagLottery() {
    if (magLotteryInterval) {
        clearInterval(magLotteryInterval);
        magLotteryInterval = null;
    }
}

// 计算TON抽奖奖励
function calculateLotteryReward(hash) {
    const lastDigit = getLastNumber(hash);  // 获取最后一个数字
    const rewards = {
        '1': toNano('0.1'),
        '2': toNano('0.2'),
        '3': toNano('0.4'),
        '4': toNano('0.8'),
        '5': toNano('1.6'),
        '6': toNano('3.2'),
        '7': toNano('6.4'),
        '8': toNano('12.8'),
        '9': toNano('25.6'),
        '0': toNano('51.2')
    };
    return rewards[lastDigit];
}

// 发送MAG奖励
async function sendMagReward(address, amount) {
    try {
        // 这里应该和 LP 质押奖励使用相同的发送逻辑
        await client.sendTransaction({
            to: address,
            amount: amount,
            payload: "MAG Reward"
        });
        return true;
    } catch (error) {
        console.error('Send reward failed:', error);
        return false;
    }
}

// 返还LP
async function returnLP(to, amount) {
    // 模拟返还LP
    console.log(`Returning ${amount} LP to ${to}`);
    return true;
}

// 执行DeDust交换
async function executeDeDustSwap(amount) {
    // 模拟DeDust交换
    console.log(`Executing DeDust swap with ${amount} TON`);
    return true;
}

// 添加MAG抽奖号码计算函数
function calculateMagLotteryNumber(hash) {
    return sumHashNumbers(hash);
}

// 添加processMagLottery函数
async function processMagLottery() {
    const now = Date.now();
    const validEntries = Array.from(magLotteryEntries.entries())
        .filter(([_, entry]) => now - entry.timestamp <= CONFIG.MAG_LOTTERY_INTERVAL);
    
    if (validEntries.length === 0) return;
    
    // 找出最大号码的所有获胜者
    const maxNumber = Math.max(...validEntries.map(([_, entry]) => entry.number));
    const winners = validEntries.filter(([_, entry]) => entry.number === maxNumber);
    
    // 计算奖池
    const totalPrize = CONFIG.MAG_LOTTERY_AMOUNT * BigInt(validEntries.length);
    const reward = (totalPrize * 90n) / 100n;
    
    // 如果有多个获胜者，平分奖励
    const perWinnerReward = reward / BigInt(winners.length);
    
    // 发放奖励给所有获胜者
    for (const [address, _] of winners) {
        await sendMagReward(address, perWinnerReward);
    }
    
    // 清空记录
    magLotteryEntries.clear();
}

// 添加辅助函数
async function getMagLotteryEntries() {
    // 这里应该从数据库或其他存储中获取参与者列表
    return [];
}

async function clearMagLotteryEntries() {
    // 清空参与者列表的逻辑
}

// LP质押记录存储
const lpStakes = new Map();

function recordLPStake(address, amount) {
    lpStakes.set(address, {
        amount,
        returnTime: Date.now() + (3 * 60 * 1000) // 3分钟后返还
    });
}

function getPendingLPReturns() {
    return Array.from(lpStakes.entries())
        .map(([address, stake]) => ({
            address,
            amount: stake.amount,
            returnTime: stake.returnTime
        }));
}

// 自动购买相关
async function checkAndTriggerAutoBuy(balance) {
    if (balance >= CONFIG.AUTO_BUY_THRESHOLD) {  // 2 TON
        try {
            // 使用与 LP 质押相同的交易发送机制
            await executeDeDustSwap(CONFIG.AUTO_BUY_AMOUNT);  // 1.5 TON
            return {
                autoBuyTriggered: true,
                buyAmount: CONFIG.AUTO_BUY_AMOUNT
            };
        } catch (error) {
            console.error('Auto buy failed:', error);
        }
    }
    return {
        autoBuyTriggered: false,
        buyAmount: 0n
    };
}

module.exports = {
    CONFIG,
    getLastNumber,
    sumHashNumbers,
    calculateLotteryReward,
    calculateMagLotteryNumber,
    generateTonLotteryCommand,
    generateLPReturnCommand,
    generateMagLotteryCommand,
    startMagLottery,
    stopMagLottery,
    processMagLottery,
    toNano, // 确保导出toNano
    TonClient, // 确保导出TonClient
    isLPTransfer,
    checkAndTriggerAutoBuy,
    recordLPStake,
    getPendingLPReturns
};
