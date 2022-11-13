## Orbs Lambda Examples

## onEvent example
[uniswap-listing-sniper](./uniswap-listing-sniper) is an example of using onEvent trigger, for the following scenario:

An anticipated token listing on Uniswap V2 is about to take place, and we want to buy the new listed token as soon as possible.

In this example, we listen to every new pair created on Uniswap, and in case it's the pair we're interested in, we use Lambda to swap ETH for some tokens and send them to our wallet.

## onInterval example
[auto-compound-eth](./auto-compound-eth) is an example of using onInterval trigger, for auto-compounding Orbs staking rewards on Ethereum.

Every time the code is run (once a week in this example), it generates a list of addresses which delegate their ORBS to a certain guardian (specified in the config file) and auto compounds their tokens.