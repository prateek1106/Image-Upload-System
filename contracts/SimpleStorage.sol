pragma experimental ABIEncoderV2;

contract SimpleStorage {
    string ipfsHash;
    int [512] [] public ipfsHashes;

    function get() public view returns (string memory) {
        return ipfsHash;
    }

    function set(string memory _value) public {
        ipfsHash = _value;
    }

    function getIpfsHashes() public view returns (int [512][] memory) {
        return ipfsHashes;
    }

    function pushToIpfsHashes(int [512] memory newValue) public {
        ipfsHashes.push(newValue);
    }
}
