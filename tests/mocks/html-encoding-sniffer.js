// Minimal stub to satisfy jsdom dependency in Vitest runs.
module.exports = function sniffEncoding() {
  return "UTF-8";
};
module.exports.default = module.exports;
