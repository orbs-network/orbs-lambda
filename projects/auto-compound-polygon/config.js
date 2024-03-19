const {stakingRewardsAbi} = require('./abi.js')

module.exports.compoundPolygonConfig = {
    stakingRewardsAbi,
    stakingRewardsAddress: "0x295d1982b1b20Cc0c02A0Da7285826c69EF71Fac",
    blockGasLimit: 30e6,
    blockUtilization: 0.25,
    baseGas: 300000,
    additionalWallet: 100000,
    maxPriorityFeePerGas: 30 * 1e9,
    maxFeePerGas: 1000 * 1e9,
    stakeThreshold: 1,
    nodeEndpoints: ['https://0xcore-matic-reader-direct.global.ssl.fastly.net/status'],
    esEndpoint: "http://logs.orbs.network:3001/putes/auto-compound",
    orbsErc20: "0x614389eaae0a6821dc49062d56bda3d9d45fa2ff",
    stakingContract: "0xeeae6791f684117b7028b48cb5dd21186df80b9c",
}