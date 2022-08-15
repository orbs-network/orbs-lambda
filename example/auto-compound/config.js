const stakingRewardsAbi = require('./abi.js')

module.exports.compoundEthConfig = {
    stakingRewardsAbi,
    stakingRewardsAddress: "0xB5303c22396333D9D27Dc45bDcC8E7Fc502b4B32",
    gasLimit: 300000,
    maxPriorityFeePerGas: 10 * 1e9,
    maxFeePerGas: 10 * 1e9,
    guardianAddress: '',
    stakeThreshold: 1
}

module.exports.compoundPolygonConfig = {
    stakingRewardsAbi,
    stakingRewardsAddress: "0x295d1982b1b20Cc0c02A0Da7285826c69EF71Fac",
    gasLimit: 500000,
    maxPriorityFeePerGas: 30 * 1e9,
    maxFeePerGas: 1000 * 1e9,
    stakeThreshold: 1,
    nodeEndpoints: ['https://0xcore-matic-reader-direct.global.ssl.fastly.net/status']
}