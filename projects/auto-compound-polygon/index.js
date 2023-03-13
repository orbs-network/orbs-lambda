const {getGuardian, getGuardians, getWeb3Polygon} = require("@orbs-network/pos-analytics-lib");
const {compoundPolygonConfig} = require("./config.js");

async function getAllDelegators(web3) {
    console.log("Getting a list of stakers...")
    let stakers = [];
    const allGuardians = await getGuardians(compoundPolygonConfig.nodeEndpoints)
    for (const guardian of allGuardians) {
        console.log(`Working on guardian ${guardian.address}`)
        const web3Polygon = await getWeb3Polygon(web3._provider.url.replace("wss", "https"));
        const g_info = await getGuardian(guardian.address, web3Polygon);
        stakers.push(g_info.address);
        for (const d of g_info.delegators) {
            if (d.stake > compoundPolygonConfig.stakeThreshold) stakers.push(d.address);
        }
    }
    console.log(`Found ${stakers.length} stakers`)
    return stakers;
}

async function claimBatch(web3, stakersList) {
    console.log('Claiming...');
    const stakingRewardContract = new web3.eth.Contract(compoundPolygonConfig.stakingRewardsAbi, compoundPolygonConfig.stakingRewardsAddress);
    let numberOfWallets = 0;
    let retry = 0;
    const from = await web3.eth.getAccounts(); // web3 object comes with account already injected
    const stakersListLen = stakersList.length;
    while (stakersList.length) {
        const staker = stakersList.shift();
        try {
            const receipt = await stakingRewardContract.methods.claimStakingRewards(staker).send({
                from: from[0],
                gas: compoundPolygonConfig.gasLimit,
                maxPriorityFeePerGas: compoundPolygonConfig.maxPriorityFeePerGas,
                maxFeePerGas: compoundPolygonConfig.maxFeePerGas
            });
            numberOfWallets += 1;
            // console.log(receipt.transactionHash);
            console.log(staker);
            retry = 0;
        } catch (e) {
            if (retry < 3) {
                console.error(`Retrying ${staker}: ${e}`);
                await new Promise(resolve => setTimeout(resolve, 1250));
                stakersList.unshift(staker)
                retry++;
            }
            else {
                console.error(`Error while claiming for ${staker}: ${e}`);
                retry = 0;
            }
        }
    }
    console.log(`Successfully claimed for ${numberOfWallets}/${stakersListLen} accounts`)
 }


async function compoundPolygon(args) {
    const stakers = await getAllDelegators(args.web3);
    await claimBatch(args.web3, stakers);
}

//////////////////

module.exports.register = function (engine) {
    engine.onCron(compoundPolygon, {cron: "0 0 * * 1", network: 'polygon'})
}
