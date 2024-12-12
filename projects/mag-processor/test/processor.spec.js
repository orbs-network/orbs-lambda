const { toNano } = require('@ton/core');
const { TonClient } = require('@ton/ton');
const { Address } = require('@ton/core');
const { handler } = require('../index');
const { 
    getLastNumber,
    sumHashNumbers,
    calculateMagLotteryNumber,
    generateTonLotteryCommand,
    generateLPReturnCommand,
    generateMagLotteryCommand,
    startMagLottery,
    calculateLotteryReward,
    recordLPStake,
    getPendingLPReturns,
    CONFIG
} = require('../ton-utils');

// 使用 jest.setup.js 中定义的 mockTonClient
const mockTonClient = global.mockTonClient;

// 创建模拟值的辅助函数
const createMockValue = () => ({
    inMessage: {
        value: '100000000',  // 0.1 TON in nanotons
        to: 'EQDdDkojazcx_uPxj6_M4TIad-TB3vvTxRwUz4s_4W9H0AmP',
        from: 'EQA...',
    },
    hash: '123456789',
    timestamp: Date.now()
});

describe('Transaction Processor Tests', () => {
    // 设置全局模拟
    beforeAll(() => {
        global.sendMagReward = jest.fn().mockResolvedValue(true);
        global.returnLP = jest.fn().mockResolvedValue(true);
        global.executeDeDustSwap = jest.fn().mockResolvedValue(true);
    });

    // 清理全局模拟
    afterAll(() => {
        delete global.sendMagReward;
        delete global.returnLP;
        delete global.executeDeDustSwap;
    });

    // 测试0.1 TON抽奖
    test('0.1 TON lottery calculation', () => {
        const mockHash = '123456789';  // 末位是9
        const reward = calculateLotteryReward(mockHash);
        expect(reward.toString()).toBe(toNano('25.6').toString()); // 2^8 * 0.1
    });

    // 测试10 MAG抽奖号码计算
    test('10 MAG lottery number calculation', () => {
        const mockHash = '12345';
        const number = calculateMagLotteryNumber(mockHash);
        expect(number).toBe(15); // 1+2+3+4+5
    });

    // 模拟交易处理
    test('process transaction', async () => {
        const mockEvent = {
            txHash: '123456789',
            sender: 'EQA...'
        };
        
        const result = await handler(mockEvent);
        expect(result.success).toBe(true);
    });

    test('should handle network errors', async () => {
        mockTonClient.getTransaction.mockRejectedValueOnce(new Error('Network error'));
        const result = await handler({ txHash: 'abc123' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });
});

describe('Hash Processing Tests', () => {
    // TON抽奖哈希处理测试
    test('should handle hash with last digit number', () => {
        const testCases = [
            { hash: 'dbd27b5f3b26b698dc447386820d28ef194953958fd5544fb4219442047d335f', expected: '5' },
            { hash: 'abc123def456789', expected: '9' },
            { hash: 'abcdef', expected: '0' },  // 没有数字应该返回0
            { hash: 'abc123def45678a', expected: '8' }
        ];

        testCases.forEach(({ hash, expected }) => {
            const lastNumber = getLastNumber(hash);
            expect(lastNumber).toBe(expected);
        });
    });

    // MAG抽奖哈希数字和测试
    test('should sum all numbers in hash', () => {
        const testCases = [
            { 
                hash: 'dbd27b5f3b26b698dc447386820d28ef194953958fd5544fb4219442047d335f',
                expected: 215  // 确保这个值是正确的
            },
            { hash: '123abc456def', expected: 21 },
            { hash: 'abcdef', expected: 0 }
        ];

        testCases.forEach(({ hash, expected }) => {
            const sum = sumHashNumbers(hash);
            expect(sum).toBe(expected);
        });
    });
});

// 测试转账命令生成
describe('Transfer Command Tests', () => {
    test('should generate correct TON lottery reward command', () => {
        const tx = {
            hash: 'dbd27b5f3b26b698dc447386820d28ef194953958fd5544fb4219442047d335f',
            sender: 'UQBurs_9BdBtUyEZT12mh...M4-wXYzb'
        };
        
        const command = generateTonLotteryCommand(tx);
        expect(command).toEqual({
            type: 'MAG_TRANSFER',
            to: tx.sender,
            amount: calculateLotteryReward(tx.hash),
            timing: 'immediate'
        });
    });

    test('should generate correct LP return command', () => {
        const stakeTime = Date.now();
        const tx = {
            hash: 'abc123',
            sender: 'UQBurs_9BdBtUyEZT12mh...M4-wXYzb',
            timestamp: stakeTime
        };
        
        const command = generateLPReturnCommand(tx);
        expect(command).toEqual({
            type: 'LP_TRANSFER',
            to: tx.sender,
            amount: CONFIG.LP_STAKE_AMOUNT,
            timing: stakeTime + (3 * 60 * 1000) // 3分钟后
        });
    });

    test('should generate correct MAG lottery reward command', () => {
        const entries = [
            { sender: 'addr1', number: 50 },
            { sender: 'addr2', number: 150 }, // winner
            { sender: 'addr3', number: 100 }
        ];
        
        const command = generateMagLotteryCommand(entries);
        expect(command).toEqual({
            type: 'MAG_TRANSFER',
            to: 'addr2',
            amount: toNano('27'), // 90% of 30 MAG (3人各投10 MAG)
            timing: 'immediate'
        });
    });
});

// 测试错误处理
describe('Error Handling Tests', () => {
    test('should handle invalid hash format', () => {
        expect(() => calculateLotteryReward(null)).toThrow();
        expect(() => calculateLotteryReward(undefined)).toThrow();
        expect(() => calculateLotteryReward('')).toThrow();
    });

    test('should handle network errors', async () => {
        // 模拟网络错误
        jest.spyOn(TonClient.prototype, 'getTransaction')
            .mockRejectedValue(new Error('Network error'));
            
        const result = await handler({ txHash: 'abc123' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });
});

// 测试定时任务
describe('Timer Tasks Tests', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        global.setInterval = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });
    
    test('should process MAG lottery at correct interval', () => {
        startMagLottery();
        expect(global.setInterval).toHaveBeenCalledWith(
            expect.any(Function),
            CONFIG.MAG_LOTTERY_INTERVAL
        );
    });
});

describe('TON Lottery Tests', () => {
    test('should calculate correct reward for all digits', () => {
        const testCases = [
            { digit: '0', expected: '51.2' },
            { digit: '1', expected: '0.1' },
            { digit: '2', expected: '0.2' },
            { digit: '9', expected: '25.6' }
        ];

        testCases.forEach(({ digit, expected }) => {
            const hash = `123456789${digit}`;
            const reward = calculateLotteryReward(hash);
            expect(reward.toString()).toBe(toNano(expected).toString());
        });
    });
});

describe('LP Stake Tests', () => {
    test('should record and return LP stakes', () => {
        const address = 'EQA...';
        const amount = toNano('1');
        
        recordLPStake(address, amount);
        const pending = getPendingLPReturns();
        
        expect(pending.length).toBe(1);
        expect(pending[0].address).toBe(address);
        expect(pending[0].amount.toString()).toBe(amount.toString());
        expect(pending[0].returnTime).toBeGreaterThan(Date.now());
    });
});

describe('MAG Lottery Tests', () => {
    test('should calculate correct lottery numbers', () => {
        const hash = '123456789';
        const number = calculateMagLotteryNumber(hash);
        expect(number).toBe(45); // 1+2+3+4+5+6+7+8+9
    });
});

describe('Auto Buy Tests', () => {
    beforeEach(() => {
        mockTonClient.getBalance.mockResolvedValue(toNano('2.5'));
    });

    test('should trigger auto buy when balance exceeds 2 TON', async () => {
        const result = await handler({ type: 'CHECK_BALANCE' });
        expect(result.autoBuyTriggered).toBe(true);
        expect(result.buyAmount.toString()).toBe(toNano('1.5').toString());
        expect(mockTonClient.getBalance).toHaveBeenCalled();
    });
});

describe('API Tests', () => {
    test('should handle balance check', async () => {
        const response = await handler({
            type: 'HTTP_POST',
            path: '/check-balance',
            body: { txHash: 'abc123' }
        });
        expect(response.success).toBe(true);
    });

    test('should process transaction', async () => {
        const response = await handler({
            type: 'HTTP_POST',
            path: '/process-transaction',
            body: { txHash: 'abc123' }
        });
        expect(response.success).toBe(true);
    });
});
