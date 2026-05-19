const fetch = require('node-fetch');

const { hash } = require('./hash');
const Signer = require('./signer');
const signer = new Signer('http://signer');
console.log('after imports')

const subnet = require('./subnet.json');

async function getConfig() {
  // TODO: fetch verified TEE pubkeys from VM-Verify, map to config entries
  return [];
}

async function buildPayload(nonce) {
  const committee = subnet
    .map(member => member.orbsAddress)
    .filter(addr => addr) // Filter out null addresses
    .map(addr => addr.startsWith('0x') ? addr : `0x${addr}`);
  const config = await getConfig();
  const payloadHash = hash(nonce, committee, config);
  return { committee, config, payloadHash };
}

async function getSyncHash(args) {
  try {
    const nonce = args?.queryParams?.nonce || 0
    if (!nonce) {
      return { payloadHash: null, error: "nonce is required" }
    }
    const { payloadHash } = await buildPayload(nonce);
    console.log("getSyncHash payloadHash: ", payloadHash);
    return { payloadHash, error: null }
  } catch (error) {
    return { payloadHash: null, error: error.message || String(error) }
  }
}

async function getSignedPayload(args) {
  try {

    const nonce = args?.queryParams?.nonce || 0
    if (!nonce) {
      return { committee: null, config: null, payloadHash: null, signature: null, error: "nonce is required" }
    }
    console.log("nonce to sign: ", nonce);

    const { committee, config, payloadHash } = await buildPayload(nonce);
    console.log("committee size: ", committee.length);
    console.log("getSignedPayload payloadHash: ", payloadHash);

    const sig = signer.sign(payloadHash)
    console.log("getSignedPayload signature: ", sig);


    return {
      committee: committee,
      config: config,
      payloadHash: payloadHash,
      signature: sig,
      error: null
    }
  } catch (error) {
    return {
      committee: null,
      config: null,
      payloadHash: null,
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
  engine.onRpc(getSyncHash, { projectName: projName, taskName: "getSyncHash" });
  engine.onRpc(getSignedPayload, { projectName: projName, taskName: "getSignedPayload" });
  engine.onRpc(hello, { projectName: projName, taskName: "hello" });
}
