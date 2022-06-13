import Web3 from "web3";

// main interface of the schema class defining a supported lambda type in a project
export abstract class Lambda {
    // standard cron expression for when using the execute function (UTC timezone). Format: https://www.ibm.com/docs/en/db2oc?topic=task-unix-cron-format
    abstract cronExpression: string;
    // network the project is running on. Default is Ethereum, but can be changed
    static network: Network = "ethereum"; // TODO: static? abstract?


    // runs once when this class is initialized
    protected onInit(args: OnInitArgs): Promise<void> {
        return Promise.resolve(undefined);
    }

    // returns whether execute() should run or not. Default is true, can be overridden
    protected shouldExecute(args: shouldExecuteArgs): Promise<boolean> {
        return Promise.resolve(true);
    }

    // protected async GetTimeSinceLastExecution(args: executionArgs): Promise<number> {
    //     return Promise.resolve(Number.MAX_SAFE_INTEGER);
    // }

    // runs periodically on a schedule defined by a cron expression
    protected abstract execute(args: executionArgs): Promise<void>; // TODO: return value?

}

export type Network = "ethereum" | "bsc" | "polygon" | "avalanche" | "fantom"; // TODO: top up guardians wallets

// arguments for onInit()
export interface OnInitArgs {
    // initialized web3 instance
    web3: Web3;
    // network the project is running on
    network: Network;
}

// arguments for shouldExecute()
export interface shouldExecuteArgs {
    // initialized web3 instance
    web3: Web3;
    // network the project is running on
    network: Network;
}

// arguments for onSchedule()
export interface executionArgs {
    // initialized web3 instance // TODO: override send(). allow gas control?
    web3: Web3;
    // network the project is running on
    network: Network;
    // the first block in the range to be scanned for potential notifications
}
