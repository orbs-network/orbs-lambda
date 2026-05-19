const Web3 = require('web3');
const web3 = new Web3();

const NAME = "OrbsCommitteeSync";
const VERSION = "1";

const EIP712_DOMAIN_TYPE = "EIP712Domain(string name,string version)";
const CONFIG_TYPE = "Config(bytes32 key,address account,bytes value)";
const DIGEST_TYPE = "Digest(uint256 nonce,address[] committee,Config[] config)";

const strip0x = Web3.utils.stripHexPrefix;
const kUtf8 = (s) => !s || s.length === 0 || s === '0x' ? "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470" : Web3.utils.keccak256(Web3.utils.utf8ToHex(s));
const k = (s) => !s || s.length === 0 || s === '0x' ? "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470" : Web3.utils.keccak256(s);

const pack32 = (xs) => "0x" + xs.map((x) => strip0x(Web3.utils.padLeft(x, 64))).join("");
const addr32 = (a) => Web3.utils.padLeft(a, 64);

const EIP712_DOMAIN_SEPARATOR = k(
  web3.eth.abi.encodeParameters(
    ["bytes32", "bytes32", "bytes32"],
    [kUtf8(EIP712_DOMAIN_TYPE), kUtf8(NAME), kUtf8(VERSION)]
  )
);

const CONFIG_TYPEHASH = kUtf8(CONFIG_TYPE);
const DIGEST_TYPEHASH = kUtf8(DIGEST_TYPE + CONFIG_TYPE);

function hashCommittee(committee) {
  const pk = pack32(committee.map(addr32))
  return k(pk);
}

const hashConfig = (cfg) =>


  k(
    pack32(
      cfg.map((c) =>
        k(
          web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32", "address", "bytes32"],
            [CONFIG_TYPEHASH, c[0], c[1], k(c[2])]
          )
        )
      )
    )
  );

const typed = (domain, struct) => k("0x1901" + strip0x(domain) + strip0x(struct));

const hash = (nonce, committee, cfg) =>
  typed(
    EIP712_DOMAIN_SEPARATOR,
    k(
      web3.eth.abi.encodeParameters(
        ["bytes32", "uint256", "bytes32", "bytes32"],
        [DIGEST_TYPEHASH, nonce, hashCommittee(committee), hashConfig(cfg)]
      )
    )
  );

module.exports = {
  hash
};

// debug
// const configElement = ['0x1234567890123456789012345678901234567890123456789012345678901234', '0x3333333471138EF42aD64829227C6cd8f1F9F47a', '0xABACAD']
// const committee = ['0x3333333471138EF42aD64829227C6cd8f1F9F47a', '0x3333333471138EF42aD64829227C6cd8f1F9F47a'.toLowerCase()];
// const result = hash(1, committee, [configElement, configElement, configElement])
// //const result = hash(1, [], [])
// console.log("result: ", result);



