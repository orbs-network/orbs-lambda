const {getGuardian} = require("@orbs-network/pos-analytics-lib");
const BigNumber = require('bignumber.js');
const {compoundEthConfig} = require("./config.js");


function bigToNumber(n) {
    return n.dividedBy("1e18").toNumber();
}

async function getDelegatorsList(web3) {
    // Retrieves a list of delegators for a specific guardian
    console.log("Getting a list of stakers...")
    let stakers = [compoundEthConfig.guardianAddress];
    const g_info = await getGuardian(compoundEthConfig.guardianAddress, web3);
    for (const d of g_info.delegators) {
        if (d.stake > compoundEthConfig.stakeThreshold) stakers.push(d.address);
    }
    console.log(`Found ${stakers.length} stakers`)
    return stakers;
}

async function claimBatch(web3, stakersList) {
    console.log('Claiming...');
    const stakingRewardContract = new web3.eth.Contract(compoundEthConfig.stakingRewardsAbi, compoundEthConfig.stakingRewardsAddress);
    let numberOfWallets = 0;
    let totalCompounded = 0;
    const from = await web3.eth.getAccounts(); // web3 object comes with account already injected
    for (const staker of stakersList) {
        try {
            const rewardBalance = await stakingRewardContract.methods.getDelegatorStakingRewardsData(staker).call();
            let balance = bigToNumber(new BigNumber(rewardBalance.balance));
            const receipt = await stakingRewardContract.methods.claimStakingRewards(staker).send({
                from: from[0],
                gas: compoundEthConfig.gasLimit,
                maxPriorityFeePerGas: compoundEthConfig.maxPriorityFeePerGas,
                maxFeePerGas: compoundEthConfig.maxFeePerGas
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

async function compoundEth(args) {
    const stakers = await getDelegatorsList(args.web3);
    await claimBatch(args.web3, stakers);
}

//////////////////

module.exports.register = function (engine) {
    engine.onInterval(compoundEth, {interval: "0 0 * * 1", network: 'ethereum'})
}
