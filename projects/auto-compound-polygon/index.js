const {getGuardian, getGuardians, getWeb3Polygon} = require("@orbs-network/pos-analytics-lib");
const {compoundPolygonConfig} = require("./config.js");
const {bigToNumber} = require("@orbs-network/pos-analytics-lib/dist/helpers");
const BigNumber = require('bignumber.js');

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
    let numberOfWallets = 0;
    let totalCompounded = 0;
    let retry = 0;
    console.log('Claiming...');
    const stakingRewardContract = new web3.eth.Contract(compoundPolygonConfig.stakingRewardsAbi, compoundPolygonConfig.stakingRewardsAddress);
    const stakersListLen = stakersList.length;
    while (stakersList.length) {
        const staker = stakersList.shift();
        try {
            const rewardBalance = await stakingRewardContract.methods.getDelegatorStakingRewardsData(staker).call();
            let balance = bigToNumber(new BigNumber(rewardBalance.balance));
            const receipt = await stakingRewardContract.methods.claimStakingRewards(staker).send({
                gas: compoundPolygonConfig.gasLimit,
                maxPriorityFeePerGas: compoundPolygonConfig.maxPriorityFeePerGas,
                maxFeePerGas: compoundPolygonConfig.maxFeePerGas
            });
            numberOfWallets += 1;
            totalCompounded += balance;
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
