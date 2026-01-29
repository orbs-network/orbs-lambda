const { ecsign, toBuffer, bufferToHex } = require("ethereumjs-util");
const fetch = require('node-fetch');

class Signer {
  constructor(host) {
    this.privateKey = '';
    this.host = host;
  }

  async init() {
    const response = await fetch(`${this.host}/manual`, { method: 'GET' });

    if (!response.ok) {
      console.error(`Failed to fetch signer key: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    if (!data || typeof data.key !== 'string' || data.key.length === 0) {
      console.error('Signer key missing in response');
      return false;
    }

    console.log("PK is set")
    console.log("public key: ", data.address)
    this.privateKey = data.key;
  }

  sign(hash32) {
    if (!this.privateKey) {
      console.error('Signer PK not initialized');
      return false;
    }
    const msgBuf = toBuffer(hash32);       // 32-byte hash
    const pk = toBuffer(this.privateKey);    // 32-byte key
    const { v, r, s } = ecsign(msgBuf, pk);
    return bufferToHex(Buffer.concat([r, s, Buffer.from([v])]));
  }
}

module.exports = Signer;


// DEBUG
const signer = new Signer('http://signer');
signer.init().then(() => {
  console.log("signer initialized");
  const sig = signer.sign('0x8ea991d095b477e5672401e84ca08cf344af384de8b2a28dd7223578cd587ba4');
  console.log("signature: ", sig);
});