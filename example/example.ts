import {executionArgs, Lambda} from "../interfaces";
import {controllerAbi} from "./abi"

const harvestControllerContract = "0x222412af183BCeAdEFd72e4Cb1b71f1889953b1C"
const f3crvVault = "0x71B9eC42bB3CB40F017D8AD8011BE8e384a95fa5"
// const gasPriceLimit = 100;

export default class HarvestCompound extends Lambda {

    cronExpression = "0 */12 * * *";  // twice a day
    private controllerContract: any;

    // async shouldExecute(args) {
        // const gasPriceWei = await args.web3.eth.getGasPrice(); // wei
        // const gasPrice = Number(args.web3.utils.fromWei(gasPriceWei, "Gwei"));
        // return Promise.resolve(gasPrice <= gasPriceLimit);

        // check rewards value
    // }

    async onInit(args) {
        this.controllerContract = new args.web3.eth.Contract(
            controllerAbi,
            harvestControllerContract
        );
    }

    protected execute(args: executionArgs) {
        // You can assume send() will sign and send the tx for you
        this.controllerContract.methods.doHardWork(f3crvVault).send();
        return Promise.resolve(undefined);
    }

}
