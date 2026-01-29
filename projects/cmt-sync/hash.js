const Web3 = require('web3');


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
            ["bytes32", "address", "uint8", "bytes32"],
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
// const configElement = ['0x3333333471138EF42aD64829227C6cd8f1F9F47a', 123, '0x3333333471138EF42aD64829227C6cd8f1F9F47a3333333471138EF42aD64829227C6cd8f1F9F47a']
// const committee = ['0x3333333471138EF42aD64829227C6cd8f1F9F47a', '0x3333333471138EF42aD64829227C6cd8f1F9F47a'.toLowerCase()];
// const result = hash(123, committee, [configElement, configElement, configElement])
// console.log("result: ", result);  