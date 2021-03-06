let node_xz = require("../build/Release/node_xz.node");
let stream = require("stream");
let util = require("util");

let DEFAULT_BUFSIZE = 128 * 1024;

class XzStream extends stream.Transform {
  constructor(mode, preset, options) {
    super(options);
    this.engine = new node_xz.Engine(mode, preset);
  }

  _transform(chunk, encoding, callback) {
    this.engine.feed(chunk);
    this._drain(chunk.length);
    callback(null);
  }

  _flush(callback) {
    this._drain(DEFAULT_BUFSIZE, node_xz.ENCODE_FINISH);
    callback(null);
  }

  _drain(estimate, flags) {
    const bufSize = Math.min(estimate * 1.1, DEFAULT_BUFSIZE);
    const segments = [];
    let n = -1;
    while (n < 0) {
      const buffer = new Buffer(bufSize);
      n = this.engine.drain(buffer, flags);
      segments.push(buffer.slice(0, Math.abs(n)));
    }
    this.push(Buffer.concat(segments));
  }
}

class Compressor extends XzStream {
  constructor(preset, options) {
    super(node_xz.MODE_ENCODE, preset, options);
  }
}

class Decompressor extends XzStream {
  constructor(options) {
    super(node_xz.MODE_DECODE, null, options);
  }
}


exports.Compressor = Compressor;
exports.Decompressor = Decompressor;
