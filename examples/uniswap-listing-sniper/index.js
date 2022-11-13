const {factoryConfig, executionConfig} = require('./config')

async function snipe(args) {
    const token0 = args.web3.eth.abi.decodeParameter('address', args.event.topics[1]);
    const token1 = args.web3.eth.abi.decodeParameter('address', args.event.topics[2]);
    if (token0 === executionConfig.token0 && token1 === executionConfig.token1) {
        const routerContract = new args.web3.eth.Contract(executionConfig.routerAbi, executionConfig.routerAddress)
        await routerContract.methods.swapExactETHForTokens(
            executionConfig.amountOutMin,
            executionConfig.path,
            executionConfig.myAddress,
            new Date().getTime() + executionConfig.expiration
            ).send({value: args.web3.utils.toWei(executionConfig.ethAmount, 'ether')})
    }
}

module.exports.register = function (engine) {
    engine.onEvent(snipe, {contractAddress: factoryConfig.contractAddress, abi: factoryConfig.abi, eventName: factoryConfig.eventName, network: "ethereum"})
}
