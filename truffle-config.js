var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "income enroll erode jar logic soldier picnic often core report fame few";
var tokenKey="09661bebc65b4b458b68df40e9f54e61";

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
      gas: 460000,
      gasPrice: 50000000000,	
    },
    solc: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
  }
};