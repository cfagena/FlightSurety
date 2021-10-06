var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "loan skin gym convince trigger solution ridge exist vivid fine tornado merry";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
      },
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "^0.8.6"
    }
  }
};