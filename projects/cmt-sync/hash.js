const NAME = "OrbsCommitteeSync";
const VERSION = "0";

const EIP712_DOMAIN_TYPE = "EIP712Domain(string name,string version)";
const CONFIG_TYPE = "Config(address account,uint8 version,bytes value)";
const DIGEST_TYPE = "Digest(uint256 nonce,address[] committee,Config[] config)";

function constants(web3) {
  const { keccak256 } = web3.utils;

  const EIP712_DOMAIN_TYPEHASH = keccak256(EIP712_DOMAIN_TYPE);
  const CONFIG_TYPEHASH = keccak256(CONFIG_TYPE);
  const DIGEST_TYPEHASH = keccak256(DIGEST_TYPE + CONFIG_TYPE);

  const EIP712_DOMAIN_SEPARATOR = keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "bytes32", "bytes32"],
      [EIP712_DOMAIN_TYPEHASH, keccak256(NAME), keccak256(VERSION)]
    )
  );

  return {
    NAME,
    VERSION,
    EIP712_DOMAIN_TYPE,
    CONFIG_TYPE,
    DIGEST_TYPE,
    EIP712_DOMAIN_TYPEHASH,
    CONFIG_TYPEHASH,
    DIGEST_TYPEHASH,
    EIP712_DOMAIN_SEPARATOR,
  };
}

function strip0x(hex) {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

function concatHex(chunks) {
  if (!chunks.length) return "0x";
  return `0x${chunks.map(strip0x).join("")}`;
}

function toHexBytes(value, web3) {
  if (value == null) return "0x";
  if (typeof value === "string") {
    if (web3.utils.isHexStrict(value)) return value;
    return web3.utils.utf8ToHex(value);
  }
  if (Array.isArray(value)) return web3.utils.bytesToHex(value);
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return web3.utils.bytesToHex(value);
  if (value instanceof Uint8Array) return web3.utils.bytesToHex(value);

  throw new TypeError("value must be a hex string, Uint8Array, Buffer, or byte array");
}

/**
 * Hashes an address array as an EIP-712 array (abi.encodePacked(bytes32[])).
 * @param {string[]} newCommittee
 * @param {object} [web3]
 * @returns {string} bytes32 hex string
 */
function hashCommittee(newCommittee, web3) {
  const hashes = newCommittee.map((addr) => {
    const checksum = web3.utils.toChecksumAddress(addr);
    return web3.utils.padLeft(checksum, 64);
  });

  return web3.utils.keccak256(concatHex(hashes));
}

/**
 * Hashes a Config[] as an EIP-712 array (abi.encodePacked(bytes32[])).
 * Each config item is { account, version, value }.
 * @param {{account: string, version: number|string, value: string|Uint8Array|Buffer|number[] }[]} newConfig
 * @param {object} [web3]
 * @returns {string} bytes32 hex string
 */
function hashConfig(newConfig, web3) {

  const { CONFIG_TYPEHASH } = constants(web3);

  const hashes = newConfig.map((cfg) => {
    const valueHash = web3.utils.keccak256(toHexBytes(cfg.value, web3));
    const encoded = web3.eth.abi.encodeParameters(
      ["bytes32", "address", "uint8", "bytes32"],
      [CONFIG_TYPEHASH, cfg.account, cfg.version, valueHash]
    );
    return web3.utils.keccak256(encoded);
  });

  return web3.utils.keccak256(concatHex(hashes));
}

function toTypedDataHash(domainSeparator, structHash, web3) {
  return web3.utils.keccak256(`0x1901${strip0x(domainSeparator)}${strip0x(structHash)}`);
}

/**
 * Returns the EIP-712 digest for a committee/config update.
 * @param {string|number|bigint} digestNonce
 * @param {string[]} newCommittee
 * @param {{account: string, version: number|string, value: string|Uint8Array|Buffer|number[] }[]} newConfig
 * @param {object} [web3]
 * @returns {string} bytes32 hex string
 */
function hash(digestNonce, newCommittee, newConfig, web3) {
  const { DIGEST_TYPEHASH, EIP712_DOMAIN_SEPARATOR } = constants(web3);

  const structHash = web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "uint256", "bytes32", "bytes32"],
      [DIGEST_TYPEHASH, digestNonce, hashCommittee(newCommittee, web3), hashConfig(newConfig, web3)]
    )
  );

  return toTypedDataHash(EIP712_DOMAIN_SEPARATOR, structHash, web3);
}

module.exports = {
  NAME,
  VERSION,
  EIP712_DOMAIN_TYPE,
  CONFIG_TYPE,
  DIGEST_TYPE,
  constants,
  hashCommittee,
  hashConfig,
  hash,
  toTypedDataHash,
};