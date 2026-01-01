const fetch = require('node-fetch');

// Membuffers helper classes for NodeSign serialization
class NodeSignInputBuilder {
  constructor(messageBuffer) {
    this.messageBuffer = messageBuffer;
  }

  build() {
    // Membuffers format: length-prefixed bytes
    // First 4 bytes: length of the message (uint32, little-endian)
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32LE(this.messageBuffer.length, 0);

    // Combine length prefix + message
    return Buffer.concat([length, this.messageBuffer]);
  }
}

class NodeSignOutputReader {
  constructor(buffer) {
    this.buffer = buffer;
  }

  getSignature() {
    // Membuffers format: length-prefixed bytes
    // First 4 bytes: length of the signature (uint32, little-endian)
    if (this.buffer.length < 4) {
      throw new Error('Invalid membuffers response: buffer too short');
    }

    const signatureLength = this.buffer.readUInt32LE(0);

    if (this.buffer.length < 4 + signatureLength) {
      throw new Error(`Invalid membuffers response: expected ${signatureLength} bytes, got ${this.buffer.length - 4}`);
    }

    // Extract signature (skip length prefix)
    return this.buffer.slice(4, 4 + signatureLength);
  }
}

async function fetchStatus() {
  const response = await fetch("http://nginx/services/ethereum-reader/status", { method: "GET" })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json()
}


async function getCurrentCommittee(args) {
  const data = await fetchStatus()
  if (data.Error) {
    return { error: data.Error }
  }

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

async function ethSign(message, serviceUrl) {
  // Convert string to Buffer
  const messageBuffer = Buffer.from(message, 'utf8');

  // Build the request body using NodeSignInputBuilder
  const body = new NodeSignInputBuilder(messageBuffer).build();
  console.log("ethSign body: ", body);

  // Make the request to /eth-sign endpoint
  const response = await fetch(`${serviceUrl}/eth-sign`, {
    method: "POST",
    body: body,
    headers: {
      "Content-Type": "application/membuffers"
    }
  });

  if (!response.ok) {
    throw new Error(`Signing failed: ${response.status} ${response.statusText}`);
  }

  // Read the signature from the response
  const responseBuffer = await response.buffer();
  const signature = new NodeSignOutputReader(responseBuffer).getSignature();

  return signature;
}

async function getSignedCommittee(args) {
  console.log("getSignedCommittee args:", args)
  try {
    const committee = await getCurrentCommittee(args);
    if (committee.error) {
      return { committee: null, signature: null, error: committee.error }
    }

    // Create array of addresses with 0x prefix for return value
    const committeeAddresses = committee.members
      .map(member => member.orbsAddress)
      .filter(addr => addr) // Filter out null addresses
      .map(addr => addr.startsWith('0x') ? addr : `0x${addr}`);

    // Use comma-separated string (without 0x prefix) for signing (maintains compatibility)
    const formated = committee.members.map(member => member.orbsAddress).join(',');
    console.log("formated: ", formated);

    const signatureBuffer = await ethSign(formated, "http://signer")
    console.log("getSignedCommittee signature: ", signatureBuffer);

    // Convert signature Buffer to hex string
    const signatureHex = `0x${signatureBuffer.toString('hex')}`;

    return {
      committee: committeeAddresses,
      signature: signatureHex,
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


module.exports.register = function (engine) {
  // get current file's directory - but just the last bit of the path  (so we can use it as the projectName)
  const path = require('path')
  const projName = path.basename(path.dirname(__filename))
  console.log("register project Name: ", projName)
  // projectName has to be the same as the folder name
  engine.onRpc(getCurrentCommittee, { projectName: projName, taskName: "getCurrentCommittee" });
  engine.onRpc(getSignedCommittee, { projectName: projName, taskName: "getSignedCommittee" });
}