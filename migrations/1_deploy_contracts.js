var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var User = artifacts.require("./User.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(User);
};
