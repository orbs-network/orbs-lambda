const abi1 = [{ "inputs": [], "name": "refundETH", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }];

async function IntervalTask(args) {
  const contract = new args.web3.eth.Contract(abi1, "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45")
  const receipt = await contract.methods.refundETH().send()
  console.log(receipt)
}

async function eventTask(args) {
  console.log(args.event.event, args.event.transactionHash)
}

async function scheduledTask(args) {
  console.log("onCron", await args.web3.eth.getChainId())
}

const abi2 = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "sender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount0In", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount1In", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount0Out", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount1Out", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }], "name": "Swap", "type": "event" }];

async function rpcTaskFn(args) {
  console.log("rpcTask args", args)
  // GET request http://signer
  const response = await fetch("http://signer/", { method: "GET" })
  // handle error
  if (!response.ok) {
    return `HTTP error! status: ${response.status}`;
  }
  const data = await response.json()
  console.log("rpcTask data:", data)
  //console.log("rpcTask chanId", await args.web3.eth.getChainId())
  return data
  //return "rpcTask result"
}

module.exports.register = function (engine) {
  // engine.onInterval(IntervalTask, {interval: "1h", network: 'goerli'})
  // engine.onEvent(eventTask, { contractAddress: "0xea26b78255df2bbc31c1ebf60010d78670185bd0", abi2, eventName: 'Swap', network: 'bsc' })
  //engine.onCron(scheduledTask, { cron: "0 0 * * *", network: 'polygon' })

  // projectName has to be the same as the folder name
  engine.onRpc(rpcTaskFn, { projectName: "test", taskName: "rpcTask3" });
}