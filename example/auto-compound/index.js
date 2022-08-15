const {getGuardian, getGuardians} = require("@orbs-network/pos-analytics-lib");
const BigNumber = require('bignumber.js');
const {compoundEthConfig, compoundPolygonConfig} = require("./config.js");


function bigToNumber(n) {
    return n.dividedBy("1e18").toNumber();
}

async function getDelegatorsList(web3, guardianAddress, stakeThreshold) {
    // Retrieves a list of delegators for a specific guardian
    console.log("Getting a list of stakers...")
    let stakers = [guardianAddress];
    const g_info = await getGuardian(guardianAddress, web3);
    for (const d of g_info.delegators) {
        if (d.stake > stakeThreshold) stakers.push(d.address);
    }
    console.log(`Found ${stakers.length} stakers`)
    return stakers;
}

async function getAllDelegators(web3, nodeEndpoints, stakeThreshold) {
    console.log("Getting a list of stakers...")
    let stakers = [];
    const allGuardians = await getGuardians(nodeEndpoints)
    for (const guardian of allGuardians) {
        console.log(`Working on guardian ${guardian.address}`)
        const g_info = await getGuardian(guardian.address, web3);
        stakers.push(g_info.address);
        for (const d of g_info.delegators) {
            if (d.stake > stakeThreshold) stakers.push(d.address);
        }
    }
    console.log(`Found ${stakers.length} stakers`)
    return stakers;
}

async function claimBatch(web3, stakersList, config) {
    console.log('Claiming...');
    const stakingRewardContract = new web3.eth.Contract(config.stakingRewardsAbi, config.stakingRewardsAddress);
    let numberOfWallets = 0;
    let totalCompounded = 0;
    const from = await web3.eth.getAccounts(); // web3 object comes with account already injected
    for (const staker of stakersList) {
        try {
            const rewardBalance = await stakingRewardContract.methods.getDelegatorStakingRewardsData(staker).call();
            let balance = bigToNumber(new BigNumber(rewardBalance.balance));
            const receipt = await stakingRewardContract.methods.claimStakingRewards(staker).send({
                from: from[0],
                gas: config.gasLimit,
                maxPriorityFeePerGas: config.maxPriorityFeePerGas,
                maxFeePerGas: config.maxFeePerGas
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

async function compoundEth(config, web3) {
    const stakers = await getDelegatorsList(web3, config.guardianAddress, config.stakeThreshold);
    await claimBatch(web3, stakers, config);
}

async function compoundPolygon(config, web3) {
    const stakers = await getAllDelegators(web3, config.nodeEndpoints, config.stakeThreshold);
    await claimBatch(web3, stakers, config);
}

//////////////////

module.exports.register = function (engine) {
    engine.onSchedule(compoundEth, "0 0 * * 1", 'ethereum', compoundEthConfig)
    engine.onSchedule(compoundPolygon, "12h", 'polygon', compoundPolygonConfig)
    engine.onEvent()
}
