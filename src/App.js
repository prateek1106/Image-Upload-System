import React, { Component } from 'react'
import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import getWeb3 from './utils/getWeb3'
import ipfs from './ipfs'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ipfsHashes: [],
      ipfsHashesPublic: [],
      shared: [],
      web3: null,
      buffer: null,
      account: null
    }

    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.convertToAsciiHash = this.convertToAsciiHash.bind(this);
    this.convertToStringHashes = this.convertToStringHashes.bind(this);
    this.shareImage = this.shareImage.bind(this);
    this.nstantiateContract = this.instantiateContract.bind(this);
  }

  //Helper Function
  //Takes Array of [BigInt] as Input and returns Array of Strings as Output
  convertToStringHashes(ipfsHashes){
    let hashes_array = [];  
    for (var j = 0; j < ipfsHashes.length ; j++) {
      let latesthash = "";
      for (var i = 0; i < ipfsHashes[j].length; i++) {
      let num = ipfsHashes[j][i].c[0];
        if(num!==0){
          latesthash+=(String.fromCharCode(num))
        }
      }
      hashes_array.push(latesthash);
    }
    return hashes_array;
  }

  //Helper Function
  //Takes String as Input and return [BigInt] as Output
  convertToAsciiHash(hash){

    let str = hash;
    let ascii_hash = [];
    for (var i = 0; i < str.length; i++) {
      ascii_hash.push(str.charAt(i).charCodeAt(0));
    }
    return ascii_hash;
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  //Initial Setup Work
  async instantiateContract() {

    const contract = require('truffle-contract')

    //Setting up SimpleStorage Contract
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(this.state.web3.currentProvider)

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      //simpleStorage.deployed().then((instance) => {
      simpleStorage.at('0xA384Abce590ef2AB0266A09d6086AFB8f30c9017').then((instance) => {

        this.simpleStorageInstance = instance
        this.setState({ account: accounts[0] })

        //Getting the IPFS Hash String array (Private IpfsHash Array)
        console.log('Requesting for Private IPFS Hashes Array:');
        console.log(this.simpleStorageInstance.getIpfsHashes.call(accounts[0]));
        return this.simpleStorageInstance.getIpfsHashes.call(accounts[0]);

      }).then((ipfsHashes) => {

        //  Convert ASCII Array to String Array 
        const hashes = this.convertToStringHashes(ipfsHashes);

        //  Update Owners List with IPFS hashes:
        let owner_list = [];
        for(var i = 0; i < hashes.length; i++){
          let hash = hashes[i];
          this.findOwner(hash).then((r)=>{
            owner_list.push([hash,r]);
            this.setState({ ipfsHashes: owner_list});
          })
        }

        //Update Shared List
        this.simpleStorageInstance.getShared.call(this.state.account, {from: this.state.account})
        .then((result) => {
          const hashes = this.convertToStringHashes(result);
          console.log('Shared Image Fetch Sucessful');
          this.setState({shared : hashes});
        })

        //Getting Public IpfsHash Array
        console.log('Requesting for Public IPFS Hashes Array:');
        console.log(this.simpleStorageInstance.getIpfsHashesPublic.call(accounts[0]));
        return this.simpleStorageInstance.getIpfsHashesPublic.call(accounts[0]);

      }).then((ipfsHashesPublic) => {

        //  Convert ASCII Array to String Array 
        const publicHashes = this.convertToStringHashes(ipfsHashesPublic);

        //  Update Owners List with Public IPFS hashes:
        let owner_list = [];
        for(var i = 0; i < publicHashes.length; i++){
          let hash = publicHashes[i];
          this.findOwner(hash).then((r)=>{
            owner_list.push([hash,r]);
            this.setState({ ipfsHashesPublic: owner_list});
          })
        }

      })
    })
  }

  captureFile(event) {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  onSubmit(event) {
    event.preventDefault()
    
    const acessibility = event.target.acessibility.value;

    //Sending buffer to IPFS and getting result hash
    ipfs.files.add(this.state.buffer, (error, result) => {
      if(error) {
        console.error(error);
        return;
      }

      const ascii_hash = this.convertToAsciiHash(result[0].hash);

      if(acessibility==="1"){
        //Upload To Public 
        this.simpleStorageInstance.uploadToPublic(ascii_hash, result[0].hash, this.state.account, 
          {from: this.state.account}).then((r) => {
            console.log('Successfully Uploaded');
          })
      }
      else{
        //Upload To Private
        this.simpleStorageInstance.uploadToPrivate(ascii_hash, result[0].hash, this.state.account, 
        {from: this.state.account}).then((r) => {
          console.log('Successfully Uploaded');
        })
      }

    });
  }

  //HELPER FUNCTION which calls Get Owner Method of Smart Contract
  async findOwner(hash) {
    let owner;
    await this.simpleStorageInstance.getOwner.call(hash, { from: this.state.account })
    .then((result) => {
      owner = result;
    })
    return owner;
  }

  //Function to handle 'Sharing Access of Image'
  shareImage(event){
    event.preventDefault();

    const ipfsHash = event.target.ipfsHash.value;
    const senderAccount = event.target.senderAccount.value;
    
    const ascii_hash = this.convertToAsciiHash(ipfsHash)
    console.log(ascii_hash);

    this.simpleStorageInstance.setShared(senderAccount,ascii_hash, { from: this.state.account })
    .then((r) => {
      console.log('Success in sharing image');
    })

  }

  render() {
    return (
      <div className="App">
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>IPFS Image Upload</h1>
              <h3>Hello, {this.state.account}</h3>
              <p>These images are stored on IPFS & The Ethereum Blockchain!</p>
              <h2>All Images (Public): </h2>
              {(this.state.ipfsHashesPublic.length!==0) &&
                this.state.ipfsHashesPublic.map( (hash,i) => (
                  <div key={i}>
                    <p> IPFS HASH: &nbsp; {hash[0]}</p>
                      {hash[0]!=="" && 
                        <div>
                          <p>Owner: &nbsp; {hash[1]}</p>
                          <img src={`https://ipfs.io/ipfs/${hash[0]}`} alt=""/>
                        </div>
                      }
                  </div>
                )
              )}

              <h2>Upload Image</h2>
              <form onSubmit={this.onSubmit} >
                <input type='file' onChange={this.captureFile} /><br/>
                
                Accessibility:<br/>
                <input type="radio" id="private" name="acessibility" value="0"/>
                <label htmlFor="private">Private</label><br/>
                <input type="radio" id="public" name="acessibility" value="1" defaultChecked/>
                <label htmlFor="public">Public</label><br/>
                 
                <input type='submit' />
              </form>

              <h2>My Images</h2>
              {(this.state.ipfsHashes.length!==0) &&
                this.state.ipfsHashes.map( (hash,i) => (
                  hash[1]===this.state.account && 
                    <div key={i}>
                      <p> IPFS HASH: &nbsp; {hash[0]}</p>
                        {hash[0]!=="" && 
                          <div>
                            <img src={`https://ipfs.io/ipfs/${hash[0]}`} alt=""/>
                          </div>
                        }
                    </div>
                )
              )}

              <h2>Share my image with someone else</h2>
              <form onSubmit={this.shareImage} >
                <input type='text' name='ipfsHash' placeholder='IPFS hash (remove later)'/><br/>
                <input type='text' name='senderAccount' placeholder='account'/><br/>
                <input type='submit'/>
              </form>

              <h2>Images Shared with me</h2>
              {(this.state.shared.length!==0) &&
                this.state.shared.map( (hash,i) => (
                  <div key={i}>
                    <p> IPFS HASH: &nbsp; {hash}</p>
                      {hash!=="" && 
                        <div>
                          <img src={`https://ipfs.io/ipfs/${hash}`} alt=""/>
                        </div>
                      }
                  </div>
                )
              )}

            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
