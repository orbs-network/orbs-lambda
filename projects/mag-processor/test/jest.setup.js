// 先定义常量，而不是引用 CONFIG
const MOCK_VALUES = {
    LOTTERY_AMOUNT: '100000000',  // 0.1 TON in nanotons
    CONTRACT_ADDRESS: 'EQDdDkojazcx_uPxj6_M4TIad-TB3vvTxRwUz4s_4W9H0AmP'
};

// 创建一个全局的 mockClient
const mockClient = {
    getTransaction: jest.fn().mockResolvedValue({
        inMessage: {
            value: MOCK_VALUES.LOTTERY_AMOUNT,
            to: MOCK_VALUES.CONTRACT_ADDRESS,
            from: 'EQA...'
        },
        hash: '123456789',
        timestamp: Date.now()
    }),
    getBalance: jest.fn().mockResolvedValue('2500000000')  // 2.5 TON
};

// 修改 mock 实现
jest.mock('@ton/ton', () => ({
    TonClient: {
        create: jest.fn().mockResolvedValue(mockClient)
    }
}));

// 导出 mockClient 以便测试文件使用
global.mockTonClient = mockClient;

// 设置其他全局 mock
global.sendMagReward = jest.fn().mockResolvedValue(true);
global.returnLP = jest.fn().mockResolvedValue(true);
global.executeDeDustSwap = jest.fn().mockResolvedValue(true);