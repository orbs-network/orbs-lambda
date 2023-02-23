const {getGuardian, getGuardians} = require("@orbs-network/pos-analytics-lib");
const BigNumber = require('bignumber.js');
const {compoundPolygonConfig} = require("./config.js");


function bigToNumber(n) {
    return n.dividedBy("1e18").toNumber();
}

async function getAllDelegators(web3) {
    console.log("Getting a list of stakers...")
    let stakers = [];
    const allGuardians = await getGuardians(compoundPolygonConfig.nodeEndpoints)
    for (const guardian of allGuardians) {
        console.log(`Working on guardian ${guardian.address}`)
        const g_info = await getGuardian(guardian.address, web3);
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
    let totalCompounded = 0;
    const from = await web3.eth.getAccounts(); // web3 object comes with account already injected
    for (const staker of stakersList) {
        try {
            const rewardBalance = await stakingRewardContract.methods.getDelegatorStakingRewardsData(staker).call();
            let balance = bigToNumber(new BigNumber(rewardBalance.balance));
            const receipt = await stakingRewardContract.methods.claimStakingRewards(staker).send({
                from: from[0],
                gas: compoundPolygonConfig.gasLimit,
                maxPriorityFeePerGas: compoundPolygonConfig.maxPriorityFeePerGas,
                maxFeePerGas: compoundPolygonConfig.maxFeePerGas
            });
            numberOfWallets += 1;
            totalCompounded += balance;
            // console.log(receipt.transactionHash);
            console.log(staker);
        } catch (e) {
            console.error(`Error while claiming for ${staker}: ${e}`);
        }
    }
    console.log(`Successfully claimed for ${numberOfWallets}/${stakersList.length} accounts`)
}


async function compoundPolygon(args) {
    const stakers = await getAllDelegators(args.web3);
    await claimBatch(args.web3, stakers);
}

//////////////////

module.exports.register = function (engine) {
    engine.onCron(compoundPolygon, {cron: "0 0 * * 1", network: 'polygon'})
}
