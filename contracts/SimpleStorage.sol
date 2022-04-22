pragma experimental ABIEncoderV2;

contract SimpleStorage {

    //list of all images/files
    int [512] [] private ipfsHashes;
    
    //list of all public images/files
    int [512] [] private ipfsHashesPublic;

    //map for storing owner information of every image/file
    mapping (string => string) private owner;

    //map for storing 'shared with me' information of every account
    mapping (string => int [512][]) private shared;

    //getter for shared map
    function getShared(string memory account) public view returns (int [512][] memory) {
        return shared[account];
    }

    //setter for shared map
    function setShared(string memory account, int [512] memory hash) public {
        shared[account].push(hash);
    }

    //getter for owner map
    function getOwner(string memory ipfsHash) public view returns (string memory) {
        return owner[ipfsHash];
    }

    //setter for owner map
    function setOwner(string memory ipfsHash, string memory account) public {
        owner[ipfsHash] = account;
    }

    //getter for IPFS hashes
    function getIpfsHashes() public view returns (int [512][] memory) {
        return ipfsHashes;
    }

    //setter for IPFS hashes
    function pushToIpfsHashes(int [512] memory newValue) public {
        ipfsHashes.push(newValue);
    }

    //getter for Public IPFS hashes
    function getIpfsHashesPublic() public view returns (int [512][] memory) {
        return ipfsHashesPublic;
    }

    //setter for Public IPFS hashes
    function pushToIpfsHashesPublic(int [512] memory newValue) public {
        ipfsHashesPublic.push(newValue);
    }

    //function to combine multiple transaction calls into single transaction
    //In Case of Public: Push to IpfsHashes as well as IpfsHashesPublic
    function uploadToPublic(int [512] memory newValue, string memory ipfsHash, string memory account) public {
        pushToIpfsHashesPublic(newValue);
        pushToIpfsHashes(newValue);
        setOwner(ipfsHash, account);
    }

    //function to combine multiple transaction calls into single transaction
    //In Case of Private: Push to only IpfsHashes
    function uploadToPrivate(int [512] memory newValue, string memory ipfsHash, string memory account) public {
        pushToIpfsHashes(newValue);
        setOwner(ipfsHash, account);
    }
}
