type Network = "ethereum" | "bsc" | "polygon" | "avalanche" | "fantom" ;

// runs periodically on a schedule defined by a cron expression
export function onSchedule(
    fn: (...args: any[]) => any,
    schedule: string, // cron expression / every x minutes/hours/days
    network: Network,
    config: { [key: string]: any }
) {}

// runs when a certain event is emitted
export function onEvent(
    fn: (...args: any[]) => any,
    contractAddress: string,
    eventName: string,
    network: Network,
    config: { [key: string]: any }
) {}

// runs on consecutive block ranges
export function onBlocks(
    fn: (...args: any[]) => any,
    network: Network,
    config: { [key: string]: any },
    fromBlock: number,
    toBlock: number
) {}

type Event = {
    event: string // The event name.
    signature: string|null // The event signature, null if it’s an anonymous event.
    address: string // Address this event originated from.
    returnValues: object // The return values coming from the event, e.g. {myVar: 1, myVar2: '0x234...'}.
    logIndex: number //Integer of the event index position in the block.
    transactionIndex: number //Integer of the transaction’s index position the event was created in.
    transactionHash: string //Hash of the transaction this event was created in.
    blockHash: string // Hash of the block this event was created in. null when it’s still pending.
    blockNumber: number // The block number this log was created in. null when still pending.
    raw: {
        data: string, // The data containing non-indexed log parameter.
        topics: string[] // An array with max 4 32 Byte topics, topic 1-3 contains indexed parameters of the event.
        }
}

export interface ExecutionArgs {
    config: { [key: string]: any };
    // List of guardians addresses  TODO
    // guardians: string[]
    // web3 api for interacting with the blockchain
    web3: any;
    // the first block in the range to be scanned for potential triggers - only relevant for onBlocks
    fromBlock?: number;
    // the last block in the range to be scanned for potential triggers - only relevant for onBlocks
    toBlock?: number;
    // array of events matching the criteria - only relevant for onEvent
    events?: Event[];
}
