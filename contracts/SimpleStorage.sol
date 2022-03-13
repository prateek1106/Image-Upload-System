pragma solidity >=0.4.24;

contract SimpleStorage {
  string ipfsHash;

  function get() public view returns (string memory) {
        return ipfsHash;
    }

    function set(string memory _value) public {
        ipfsHash = _value;
    }
}
