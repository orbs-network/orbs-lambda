const { initTonClient, isLPTransfer, isMagTransfer, CONFIG } = require('./ton-utils');
const { TonClient } = require('@ton/ton');

const magLotteryEntries = new Map(); // 存储MAG抽奖记录
let magLotteryInterval; // 声明一个变量来存储定时器

async function handler(event) {
    try {
        const client = await TonClient.create();
        
        if (event.type === 'CHECK_BALANCE') {
            const balance = await client.getBalance(CONFIG.CONTRACT_ADDRESS);
            
            // 如果余额超过2 TON
            if (balance >= toNano('2')) {
                // 发送1.5 TON去DeDust购买MAG
                await executeDeDustSwap(toNano('1.5'));
                return {
                    success: true,
                    autoBuyTriggered: true,
                    buyAmount: toNano('1.5')
                };
            }
            
            return {
                success: true,
                autoBuyTriggered: false,
                buyAmount: 0n
            };
        }

        const tx = await client.getTransaction(event.txHash);
        
        // 2. 根据交易类型生成命令
        const command = await analyzeTransaction(tx);
        
        // 3. 设置执行时间
        const executionTime = calculateExecutionTime(command.type);
        
        return { 
            success: true,
            command: {
                ...command,
                executionTime
            }
        };
    } catch (error) {
        console.error('Error:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// MAG抽奖开奖函数
async function processMagLottery() {
    const now = Date.now();
    const validEntries = Array.from(magLotteryEntries.entries())
        .filter(([_, entry]) => now - entry.timestamp <= CONFIG.MAG_LOTTERY_INTERVAL);
    
    if (validEntries.length === 0) return;
    
    // 找出最大号码的获胜者
    const winner = validEntries.reduce((max, curr) => 
        curr[1].number > max[1].number ? curr : max
    );
    
    // 计算奖池
    const totalPrize = CONFIG.MAG_LOTTERY_AMOUNT * BigInt(validEntries.length);
    const reward = (totalPrize * 90n) / 100n;
    
    // 发放奖励
    await sendMagReward(winner[0], reward);
    
    // 清空记录
    magLotteryEntries.clear();
}

function startMagLottery() {
    magLotteryInterval = setInterval(processMagLottery, CONFIG.MAG_LOTTERY_INTERVAL);
}

function stopMagLottery() {
    if (magLotteryInterval) {
        clearInterval(magLotteryInterval);
    }
}

// 在测试文件中添加清理
afterAll(() => {
    stopMagLottery();
});

// 注册触发器
module.exports.register = function(engine) {
    // 1. 监听前端信号的API
    engine.onHttpPost('/check-balance', async (req) => {
        const { txHash } = req.body;
        // 等待30秒
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const client = await TonClient.create();
        const balance = await client.getBalance(CONFIG.CONTRACT_ADDRESS);
        
        if (balance >= toNano('2')) {
            await executeDeDustSwap(toNano('1.5'));
            return {
                success: true,
                autoBuyTriggered: true,
                buyAmount: toNano('1.5')
            };
        }
        return {
            success: true,
            autoBuyTriggered: false
        };
    });

    // 2. 监听交易的API
    engine.onHttpPost('/process-transaction', async (req) => {
        const { txHash } = req.body;
        const tx = await client.getTransaction(txHash);
        const command = await analyzeTransaction(tx);
        return command;
    });

    // 3. MAG抽奖仍然需要定时
    engine.onInterval(processMagLottery, {
        interval: "24m",
        network: "ton"
    });
};

module.exports = {
    handler
};
