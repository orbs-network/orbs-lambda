const stakingRewardsAbi = require('./abi.js')

module.exports.compoundEthConfig = {
    guardianAddress: '0x', // set address here
    stakingRewardsAbi,
    stakingRewardsAddress: "0xB5303c22396333D9D27Dc45bDcC8E7Fc502b4B32",
    gasLimit: 300000,
    maxPriorityFeePerGas: 10 * 1e9,
    maxFeePerGas: 10 * 1e9,
    stakeThreshold: 1
}