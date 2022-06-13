# Orbs Lambda

### An open always-free notification protocol for DeFi on-chain events.

## Goals

1. goal 1

   > goal 1

2. goal 2

   > goal 2

&nbsp;

## How to integrate a new project

Integrating notifications for a new project requires implementing a small [web3](https://github.com/ChainSafe/web3.js)-compatible TypeScript class and creating a new [PR](https://docs.github.com/en/github/collaborating-with-pull-requests) to add the class to this repo.

Your custom class should inherit from `Lambda` class from [here](interfaces.ts).

## Cron Expression
standard cron expression for using the execute function. UTC timezone.

Format:
```
 *    *    *    *    *
┬    ┬    ┬    ┬    ┬
│    │    │    │    |
│    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    └───── month (1 - 12)
│    │    └────────── day of month (1 - 31)
│    └─────────────── hour (0 - 23)
└──────────────────── minute (0 - 59)

```
More examples: https://www.ibm.com/docs/en/db2oc?topic=task-unix-cron-format

## Sending transactions
You can use the web3 object you get as argument to send transactions. Just create the contract object and use the `send()` method, which is the same as [the official send()](https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#methods-mymethod-send), only without the `from` option.
You can assume send() will sign and send the tx for you.

See [here](interfaces.ts) for more info.

### [Example](./example/example.ts) - auto compounding for Harvest Finance.

This task runs once a day and triggers doHardWork for a specific vault.

```ts
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

```

### Documentation and more examples

Formal TypeScript type definitions for the class interface are available [here](interfaces.ts). Explore example integrations to different projects by browsing the different directories in this repo.

### Testing your integration

TODO

## Execution environment

These TypeScript classes are constantly executed by Orbs nodes in order to execute different tasks based on their schedule. Nodes are currently supported on the [Orbs Network](https://orbs.com) and executed by the public validators of the network.