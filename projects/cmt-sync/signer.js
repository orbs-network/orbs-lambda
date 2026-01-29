const { ecsign } = require("ethereumjs-util");
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

    this.privateKey = data.privateKey;
  }

  sign(msg) {
    if (!this.privateKey) {
      console.error('Signer not initialized');
      return false;
    }
    const msgBuf = toBuffer(hash32);       // 32-byte hash
    const pk = toBuffer(privateKey);    // 32-byte key
    const { v, r, s } = ecsign(msgBuf, pk);
    return bufferToHex(Buffer.concat([r, s, Buffer.from([v])]));
  }
}

module.exports = Signer;
