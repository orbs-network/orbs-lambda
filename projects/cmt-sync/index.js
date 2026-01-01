const fetch = require('node-fetch');

async function fetchStatus() {
  const response = await fetch("http://ethereum-reader/status", { method: "GET" })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json()
}


async function getCurrentCommittee(args) {
  const data = await fetchStatus()
  const committee = data.Payload?.CurrentCommittee || []
  const topology = data.Payload?.CurrentTopology || []

  // Create a map of EthAddress -> OrbsAddress from topology
  const addressMap = {}
  topology.forEach(node => {
    if (node.EthAddress && node.OrbsAddress) {
      addressMap[node.EthAddress.toLowerCase()] = node.OrbsAddress
    }
  })

  return {
    size: committee.length,
    members: committee.map(member => ({
      ethAddress: member.EthAddress,
      orbsAddress: addressMap[member.EthAddress?.toLowerCase()] || null,
      weight: member.Weight,
      effectiveStake: member.EffectiveStake,
      name: member.Name,
      identityType: member.IdentityType,
      enterTime: member.EnterTime
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
  console.log("getSignedCommittee args:", args)
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
  // get current directory - but just the last bit of the path  (so we can use it as the projectName)
  const projName = process.cwd().split('/').pop()
  console.log("currentDirectory:", projName)
  // projectName has to be the same as the folder name

  engine.onRpc(getCurrentCommittee, { projectName: projName, taskName: "getCurrentCommittee" });
  engine.onRpc(getSignedCommittee, { projectName: projName, taskName: "getSignedCommitteeFn" });
}