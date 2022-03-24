var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "income enroll erode jar logic soldier picnic often core report fame few";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: function() { 
       return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/fbc754c952f04fa4ac2249c7bdce8c51");
      },
      network_id: 4,
      gas: 4600000,	// <-- Use this high gas value
      gasPrice: 0x01,	// <-- Use this low gas price
    },
    compilers: {
      solc: {
        version: "5.5.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "byzantium"
        }
      }
    }
  }
};