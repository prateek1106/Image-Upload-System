pragma experimental ABIEncoderV2;

contract SimpleStorage {

    //list of all images/files
    int [512] [] private ipfsHashes;
    
    //list of all public images/files
    int [512] [] private ipfsHashesPublic;

    //map for storing whether image is public or not
    mapping(string => bool) presentInIpfsHashesPublic;

    //map for storing owner information of every image/file
    mapping (string => string) private owner;

    //map for storing title information of every image/file
    mapping (string => string) private title;

    //map for storing 'shared with me' information of every account
    mapping (string => int [512][]) private shared;

    //map for storing list of all accounts which have access of current image/file
    mapping (string => int [512][]) private imageAccess;

    //getter for image access map
    function getImageAccess(string memory ipfsHash) public view returns (int [512][] memory) {
        return imageAccess[ipfsHash];
    }

    //setter for image access map
    function setImageAccess(string memory ipfsHash, int [512] memory account) public {
        imageAccess[ipfsHash].push(account);
    }
    
    //getter for shared map
    function getShared(string memory account) public view returns (int [512][] memory) {
        return shared[account];
    }

    //setter for shared map
    function setShared(string memory account, int [512] memory hash) public {
        shared[account].push(hash);
    }

    //function to combine multiple transaction calls into single transaction
    function shareAccess(string memory account, int [512] memory hash, string memory ipfsHash, int [512] memory account_hash) public {
        setShared(account, hash);
        setImageAccess(ipfsHash, account_hash);
    }

    //deletion from shared map
    function removeShared(string memory account, int [512] memory hash) public {
        
        //Find Index of Element to be deleted
        uint deletion_index;
        for(uint i=0; i<shared[account].length;i++){
            if( keccak256(abi.encodePacked(shared[account][i])) == keccak256(abi.encodePacked(hash))){
                deletion_index = i;
                break;
            }
        }

        //Delete Element
        shared[account][deletion_index] = shared[account][shared[account].length-1];
        shared[account].pop();
    }

    //deletion from image access map
    function removeImageAccess(string memory ipfsHash, int [512] memory account) public {

        //Find Index of Element to be deleted
        uint deletion_index;
        for(uint i=0; i<imageAccess[ipfsHash].length;i++){
            if( keccak256(abi.encodePacked(imageAccess[ipfsHash][i])) == keccak256(abi.encodePacked(account))){
                deletion_index = i;
                break;
            }
        }

        //Delete Element
        imageAccess[ipfsHash][deletion_index] = imageAccess[ipfsHash][imageAccess[ipfsHash].length-1];
        imageAccess[ipfsHash].pop();
    }

    //function to combine multiple transaction calls into single transaction
    function removeAccess(string memory account, int [512] memory hash, string memory ipfsHash, int [512] memory account_hash) public {
        removeShared(account, hash);
        removeImageAccess(ipfsHash, account_hash);
    }

    //getter for owner map
    function getOwner(string memory ipfsHash) public view returns (string memory) {
        return owner[ipfsHash];
    }

    //setter for owner map
    function setOwner(string memory ipfsHash, string memory account) public {
        owner[ipfsHash] = account;
    }

    //getter for title map
    function getTitle(string memory ipfsHash) public view returns (string memory) {
        return title[ipfsHash];
    }

    //setter for title map
    function setTitle(string memory ipfsHash, string memory _title) public {
        title[ipfsHash] = _title;
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

    //setter for presentInIpfsHashesPrivate Map
    function setPresentInIpfsHashesPublic(string memory ipfsHash) public{
        presentInIpfsHashesPublic[ipfsHash] = true;
    }

    function getAcessibility(string memory ipfsHash) public view returns (bool){
        return presentInIpfsHashesPublic[ipfsHash];
    }

    //function to combine multiple transaction calls into single transaction
    //In Case of Public: Push to IpfsHashes as well as IpfsHashesPublic
    function uploadToPublic(int [512] memory newValue, string memory ipfsHash, string memory account, string memory _title) public {
        pushToIpfsHashesPublic(newValue);
        pushToIpfsHashes(newValue);
        setOwner(ipfsHash, account);
        setTitle(ipfsHash, _title);
        setPresentInIpfsHashesPublic(ipfsHash);
    }

    //function to combine multiple transaction calls into single transaction
    //In Case of Private: Push to only IpfsHashes
    function uploadToPrivate(int [512] memory newValue, string memory ipfsHash, string memory account, string memory _title) public {
        pushToIpfsHashes(newValue);
        setOwner(ipfsHash, account);
        setTitle(ipfsHash, _title);
    }
}
