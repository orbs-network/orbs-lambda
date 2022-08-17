const {factoryConfig, executionConfig} = require('./config')

async function snipe(web3, storage, config, event) {
    if (event.returnValues.token0 === config.token0 && event.returnValues.token1 === config.token1) {
        const routerContract = new web3.eth.Contract(config.routerAbi, config.routerAddress)
        await routerContract.methods.swapExactETHForTokens(
            config.amountOutMin,
            config.path,
            config.myAddress,
            new Date().getTime() + config.expiration
            ).send({value: web3.utils.toWei(config.ethAmount, 'ether')})
    }
}

module.exports.register = function (engine) {
    engine.onEvent(snipe, factoryConfig.contractAddress, factoryConfig.abi, factoryConfig.eventName, "ethereum", executionConfig)
}
