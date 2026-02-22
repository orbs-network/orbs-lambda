const fetch = require('node-fetch');

const { hash } = require('./hash');
const Signer = require('./signer');
const signer = new Signer('http://signer');
console.log('after imports')

// Membuffers helper classes for NodeSign serialization
const subnet = require('./subnet.json');

function getCurrentCommittee(args) {
  return {
    "size": subnet.length,
    "members": subnet
  }
}

async function getSignedCommittee(args) {
  try {

    const nonce = args?.queryParams?.nonce || 0
    if (!nonce) {
      return { committee: null, signature: null, error: "nonce is required" }
    }
    console.log("nonce to sign: ", nonce);

    // Create array of addresses with 0x prefix for return value
    const committeeAddresses = subnet
      .map(member => member.orbsAddress)
      .filter(addr => addr) // Filter out null addresses
      .map(addr => addr.startsWith('0x') ? addr : `0x${addr}`);

    console.log("committeeAddresses: ", committeeAddresses.length);

    // create EIP-712 compatible hash
    const committeeHash = hash(nonce, committeeAddresses, []);
    console.log("getSignedCommittee hash: ", committeeHash);

    const sig = signer.sign(committeeHash)
    console.log("getSignedCommittee signature: ", sig);


    return {
      committee: committeeAddresses,
      committeeHash: committeeHash,
      signature: sig,
      error: null
    }
  } catch (error) {
    return {
      committee: null,
      signature: null,
      error: error.message || String(error)
    }
  }
}


async function hello(args) {
  console.log("hello queryParams args: ", args.queryParams)
  return { message: "Hello, world!" }
}

module.exports.register = async function (engine) {
  await signer.init();
  if (!signer.privateKey) {
    console.error('Signer PK not initialized');
    return false;
  }
  // get current file's directory - but just the last bit of the path  (so we can use it as the projectName)
  const path = require('path')
  const projName = path.basename(path.dirname(__filename))
  console.log("register project Name: ", projName)
  // projectName has to be the same as the folder name
  engine.onRpc(getCurrentCommittee, { projectName: projName, taskName: "getCurrentCommittee" });
  engine.onRpc(getSignedCommittee, { projectName: projName, taskName: "getSignedCommittee" });
  engine.onRpc(hello, { projectName: projName, taskName: "hello" });
}