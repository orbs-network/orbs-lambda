const {getDelegators, getGuardians, getWeb3Polygon} = require("@orbs-network/pos-analytics-lib");
const {compoundPolygonConfig} = require("./config.js");
const {bigToNumber} = require("@orbs-network/pos-analytics-lib/dist/helpers");
const BigNumber = require('bignumber.js');
const EthereumMulticall = require('@orbs-network/ethereum-multicall');

async function CalcAndSendMetrics(web3, numberOfWallets, totalCompounded) {
    // get staking balance
    const minABI = [{"constant":true, "inputs":[{"name":"_owner","type":"address"}], "name":"balanceOf", "outputs":[{"name":"balance","type":"uint256"}], "type":"function"}, {"constant":true, "inputs":[], "name":"decimals", "outputs":[{"name":"","type":"uint8"}], "type":"function"}];
    const tokenContract = new web3.eth.Contract(minABI, compoundPolygonConfig.orbsErc20)
    let stakingBalance = await tokenContract.methods.balanceOf(compoundPolygonConfig.stakingContract).call();
    stakingBalance = bigToNumber(new BigNumber(stakingBalance));

    const json = {"numberOfWallets": numberOfWallets, "totalCompounded": totalCompounded, "stakingBalance": stakingBalance}
    const response = await fetch(compoundPolygonConfig.esEndpoint, {
        method: 'post',
        body: JSON.stringify(json),
        headers: {'Content-Type': 'application/json'}
    });
}

async function getAllDelegators(web3) {
    console.log("Getting a list of stakers...")
    let stakers = [];
    const allGuardians = await getGuardians(compoundPolygonConfig.nodeEndpoints)
    for (const guardian of allGuardians) {
        console.log(`Working on guardian ${guardian.address}`)
        const web3Polygon = await getWeb3Polygon(web3._provider.url.replace("wss", "https"));
        const g_info = await getDelegators(guardian.address, web3Polygon);
        stakers.push(guardian.address);
        for (const d of g_info) {
            if (d.stake > compoundPolygonConfig.stakeThreshold) stakers.push(d.address);
        }
    }
    console.log(`Found ${stakers.length} stakers`)
    return stakers;
}

async function claimBatch(web3, stakersList) {
    let numberOfWallets = 0;
    let totalCompounded = 0;
    console.log('Claiming...');
    const multicall = new EthereumMulticall.Multicall({web3Instance: web3});
    const stakingRewardContract = new web3.eth.Contract(compoundPolygonConfig.stakingRewardsAbi, compoundPolygonConfig.stakingRewardsAddress);
    const stakersListLen = stakersList.length;
    let calls;

    const chunksNum = Math.ceil((compoundPolygonConfig.baseGas+compoundPolygonConfig.additionalWallet*stakersListLen) / (compoundPolygonConfig.blockGasLimit*compoundPolygonConfig.blockUtilization));
    const chunkSize = Math.floor(stakersListLen/chunksNum)
    console.log(`Running in ${chunksNum} chunks of ${chunkSize}`);
    for (let i = 0, j=1; i < stakersList.length; i += chunkSize, j += 1) {
        calls = [];
        const chunk = stakersList.slice(i, i + chunkSize);
        while (chunk.length) {
            const staker = chunk.shift();
            const rewardBalance = await stakingRewardContract.methods.getDelegatorStakingRewardsData(staker).call();
            let balance = bigToNumber(new BigNumber(rewardBalance.balance));
            numberOfWallets += 1;
            totalCompounded += balance;

            calls.push({
                reference: 'autoCompound',
                methodName: 'claimStakingRewards',
                methodParameters: [staker]
            })
        }
        const contractCallContext = [{
            reference: 'autoCompound',
            contractAddress: compoundPolygonConfig.stakingRewardsAddress,
            abi: compoundPolygonConfig.stakingRewardsAbi,
            calls
        }];
        await multicall.send(contractCallContext, {
                from: web3.eth.accounts.wallet[0].address,
                gas: compoundPolygonConfig.blockGasLimit * compoundPolygonConfig.blockUtilization,
                maxPriorityFeePerGas: compoundPolygonConfig.maxPriorityFeePerGas,
                maxFeePerGas: compoundPolygonConfig.maxFeePerGas
            }
        )
        console.log(`Finished chunk ${j}/${chunksNum}`);
    }
    console.log(`Successfully claimed for ${numberOfWallets}/${stakersListLen} accounts`);
    return {numberOfWallets, totalCompounded};
}


async function compoundPolygon(args) {
    const stakers = await getAllDelegators(args.web3);
    const {numberOfWallets, totalCompounded} = await claimBatch(args.web3, stakers);
    await CalcAndSendMetrics(args.web3, numberOfWallets, totalCompounded)

}

//////////////////

module.exports.register = function (engine) {
    engine.onCron(compoundPolygon, {cron: "0 0 * * 1", network: 'polygon'})
}
