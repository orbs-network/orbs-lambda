const fetch = require('node-fetch');

const { hash } = require('./hash');
const Signer = require('./signer');
const signer = new Signer('http://signer');
console.log('after imports')

// Membuffers helper classes for NodeSign serialization


async function fetchStatus() {
  const readerUrl = process.env.READER_URL || "http://nginx/services/ethereum-reader/status"
  const response = await fetch(readerUrl, { method: "GET" })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json()
}

// subnet hard coded implementation
async function getCurrentCommittee(args) {
  const localEthAddress = "0x0000000000000000000000000000000000000000"
  const localOrbsAddress = "0x0000000000000000000000000000000000000000"

  const committee = {}
  addressMap[localEthAddress] = localOrbsAddress



  return {
    size: addressMap.Keys.length,
    members: committee.map(k, v => ({
      ethAddress: k,
      orbsAddress: v.toLowerCase(),
      weight: 0,
      effectiveStake: 0,
      name: "subnet",
      identityType: "UNKNOWN",
      enterTime: "UNKNOWN"
    }))
  }
}

async function getCommitteeSize(args) {
  const data = await fetchStatus()
  return {
    size: data.Payload?.CurrentCommittee?.length || 0,
    status: data.Status
  }
}

async function getGuardianInfo(args) {
  const data = await fetchStatus()
  const ethAddress = args?.ethAddress?.toLowerCase()
  if (!ethAddress) {
    return { error: "ethAddress parameter is required" }
  }

  const guardian = data.Payload?.Guardians?.[ethAddress]
  if (!guardian) {
    return { error: `Guardian with address ${ethAddress} not found` }
  }

  return {
    ethAddress: guardian.EthAddress,
    orbsAddress: guardian.OrbsAddress,
    name: guardian.Name,
    effectiveStake: guardian.EffectiveStake,
    selfStake: guardian.SelfStake,
    delegatedStake: guardian.DelegatedStake,
    identityType: guardian.IdentityType,
    website: guardian.Website,
    ip: guardian.Ip,
    electionsStatus: guardian.ElectionsStatus,
    registrationTime: guardian.RegistrationTime
  }
}

async function getContractAddresses(args) {
  const data = await fetchStatus()
  return data.Payload?.CurrentContractAddress || {}
}

async function getEventStats(args) {
  const data = await fetchStatus()
  return {
    totalEventsProcessed: data.Payload?.EventsStats?.TotalEventsProcessed || 0,
    lastUpdateBlock: data.Payload?.EventsStats?.LastUpdateBlock || 0,
    eventCount: data.Payload?.EventsStats?.EventCount || {}
  }
}

async function getTopology(args) {
  const data = await fetchStatus()
  return data.Payload?.CurrentTopology || []
}

async function getCandidates(args) {
  const data = await fetchStatus()
  return {
    candidates: data.Payload?.CurrentCandidates || [],
    count: data.Payload?.CurrentCandidates?.length || 0
  }
}

async function getSignedCommittee(args) {

  try {
    const committee = await getCurrentCommittee(args);
    if (committee.error) {
      return { committee: null, signature: null, error: committee.error }
    }

    const nonce = args?.queryParams?.nonce || 0
    if (!nonce) {
      return { committee: null, signature: null, error: "nonce is required" }
    }
    console.log("nonce: ", nonce);

    // Create array of addresses with 0x prefix for return value
    const committeeAddresses = committee.members
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