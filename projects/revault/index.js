const {tvlsConfig, poolsConfig} = require('./config')

async function updateTvls(args) {
    const tvlsContract = new args.web3.eth.Contract(tvlsConfig.abi, tvlsConfig.contractAddress);
    await tvlsContract.methods[tvlsConfig.method]().send()
}

async function updatePools(args) {
    const poolsContract = new args.web3.eth.Contract(poolsConfig.abi, poolsConfig.contractAddress);
    for (const id of poolsConfig.poolIds) {
        await poolsContract.methods[poolsConfig.method](id).send();
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

module.exports.register = function (engine) {
    engine.onInterval(updateTvls, {interval: "8h", network: 'bsc'})
    engine.onInterval(updatePools, {interval: "1d", network: 'bsc'})
}
