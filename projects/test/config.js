const {abi} = require('./abi.js')

module.exports.tvlsConfig = {
    contractAddress: "0xd7550285532f1642511b16Df858546F2593d638B",
    abi,
    method: "updateAllTvls"
}

module.exports.poolsConfig = {
    contractAddress: "0xe8f1CDa385A58ae1C1c1b71631dA7Ad6d137d3cb",
    abi,
    method: "updatePool",
    poolIds: [0, 1, 2, 3]
}