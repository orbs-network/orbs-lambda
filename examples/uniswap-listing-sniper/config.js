const {factoryAbi, routerAbi} = require('./abis.js')

module.exports.factoryConfig = {
    contractAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    abi: factoryAbi,
    eventName: "PairCreated"
}

module.exports.executionConfig = {
    routerAbi,
    routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    token0: "0x6b175474e89094c44da98b954eedeac495271d0f",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ethAmount: 0.1,
    amountOutMin: 100,
    path: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,0x6b175474e89094c44da98b954eedeac495271d0f",
    myAddress: "0x0",
    expiration: 20*60 // 20 minutes in seconds
}