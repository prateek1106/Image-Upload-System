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
      myImages: [],
      web3: null,
      buffer: null,
      account: null
    }

    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.convertToAsciiHash = this.convertToAsciiHash.bind(this);
    this.convertToStringHashes = this.convertToStringHashes.bind(this);
    this.shareImage = this.shareImage.bind(this);
    this.instantiateContract = this.instantiateContract.bind(this);
    this.getImageAcessInfo = this.getImageAcessInfo.bind(this);
    this.removeImageAccess = this.removeImageAccess.bind(this);
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

  //Helper Function
  setHashes(ipfsHashList, newList) {
    const hashes = this.convertToStringHashes(ipfsHashList);
    const hash_length = hashes.length;

    let new_list = [];
    for (var i = 0; i < hashes.length; i++) {
      let hash = hashes[i];

      //Find Owner
      this.findOwner(hash).then((owner) => {
        //Find Title
        this.findTitle(hash).then((title) => {
          //Assign Owner and Title to New List
          new_list.push([hash, owner, title]);
          if(new_list.length===hash_length)
            this.setState({ [newList]: new_list});
          });
      });
    }
  }

  //Initial Setup Work
  async instantiateContract() {

    const contract = require('truffle-contract')

    //Setting up SimpleStorage Contract
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(this.state.web3.currentProvider)

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      simpleStorage.deployed().then((instance) => {
      //simpleStorage.at('0xA384Abce590ef2AB0266A09d6086AFB8f30c9017').then((instance) => {

        this.simpleStorageInstance = instance
        this.setState({ account: accounts[0] })

        //Getting the IPFS Hash String array (Private IpfsHash Array)
        console.log('Requesting for Private+Public IPFS Hashes Array:');
        console.log(this.simpleStorageInstance.getIpfsHashes.call(accounts[0]));
        return this.simpleStorageInstance.getIpfsHashes.call(accounts[0]);

      }).then((ipfsHashList) => {

        //Assigning Owner and Title to All Images
        this.setHashes(ipfsHashList,'ipfsHashes');

        //Assigning My Images List
        this.getMyImages(ipfsHashList);

        //Getting Public IpfsHash Array
        console.log('Requesting for Public IPFS Hashes Array:');
        console.log(this.simpleStorageInstance.getIpfsHashesPublic.call(accounts[0]));
        return this.simpleStorageInstance.getIpfsHashesPublic.call(accounts[0]);

      }).then((ipfsHashList) => {

        //Assigning Owner and Title to Public Images
        this.setHashes(ipfsHashList,'ipfsHashesPublic');

        //Update Shared List
        return this.simpleStorageInstance.getShared.call(this.state.account, {from: this.state.account});

      }).then((sharedList) => {
        
        //Assigning Owner and Title to Shared Images
        this.setHashes(sharedList,'shared');
      }) 
    })
  }

  //Helper Function for assigning my images array with public / private info
  getMyImages(ipfsHashList) {
    const hashes = this.convertToStringHashes(ipfsHashList);
    const hash_length = hashes.length;

    let my_images = [];
    for (var i = 0; i < hashes.length; i++) {
      let hash = hashes[i];

      //Find Owner
      this.findOwner(hash).then((owner) => {
          //Find Title
          this.findTitle(hash).then((title) => {
            //Find Public / Private Info
            this.findAcessibility(hash).then((acessibility) => {
              //Assign Owner, Title, and Acessibility Info to List

              my_images.push([hash, owner, title, (acessibility===true?"Public":"Private")]);
              if(my_images.length===hash_length)
                this.setState({ myImages: my_images});
            });
          });
      });
    }
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
    const title = event.target.title.value;

    //Sending buffer to IPFS and getting result hash
    ipfs.files.add(this.state.buffer, (error, result) => {
      if(error) {
        console.error(error);
        return;
      }

      const ascii_hash = this.convertToAsciiHash(result[0].hash);

      if(acessibility==="1"){
        //Upload To Public 
        this.simpleStorageInstance.uploadToPublic(ascii_hash, result[0].hash, this.state.account, title,
          {from: this.state.account}).then((r) => {
            console.log('Successfully Uploaded');
          })
      }
      else{
        //Upload To Private
        this.simpleStorageInstance.uploadToPrivate(ascii_hash, result[0].hash, this.state.account, title,
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

  //HELPER FUNCTION which calls Get Title Method of Smart Contract
  async findTitle(hash) {
    let title;
    await this.simpleStorageInstance.getTitle.call(hash, { from: this.state.account })
    .then((result) => {
      title = result;
    })
    return title;
  }

  //HELPER FUNCTION which calls Get Acessibility Method of Smart Contract
  async findAcessibility(hash) {
    let acessibility;
    await this.simpleStorageInstance.getAcessibility.call(hash, { from: this.state.account })
    .then((result) => {
      acessibility = result;
    })
    return acessibility;
  }

  //Function to handle 'Sharing Access of Image'
  shareImage(event){
    event.preventDefault();

    const ipfsHash = event.target.ipfsHash.value;
    const senderAccount = event.target.senderAccount.value;
    
    const ascii_hash = this.convertToAsciiHash(ipfsHash);
    const account_hash = this.convertToAsciiHash(senderAccount);
    //console.log(ascii_hash);
    //console.log(account_hash);

    this.simpleStorageInstance.shareAccess(senderAccount, ascii_hash, ipfsHash, account_hash ,
      {from: this.state.account})
      .then((r => {
        console.log('Success in sharing image');
      }))

  }

  //Function to find what all accounts have access to particular image
  getImageAcessInfo(event) {
    event.preventDefault();
    const ipfsHash = event.target.ipfsHash.value;

    this.simpleStorageInstance.getImageAccess.call(ipfsHash, {from: this.state.account})
    .then((result) => {
      console.log('List of Accounts which have access: ');
      //console.log(result);
      const accounts = this.convertToStringHashes(result);
      console.log(accounts);
      return accounts;

    })
  }

  removeImageAccess(event) {
    event.preventDefault();

    const ipfsHash = event.target.ipfsHash.value;
    const senderAccount = event.target.senderAccount.value;

    const ascii_hash = this.convertToAsciiHash(ipfsHash);
    const account_hash = this.convertToAsciiHash(senderAccount);
    //console.log(ascii_hash);
    //console.log(account_hash);

    this.simpleStorageInstance.removeAccess(senderAccount, ascii_hash, ipfsHash, account_hash ,
      {from: this.state.account})
      .then((r => {
        console.log('Success in removing image access');
      }))
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
                          <p>Title: &nbsp; {hash[2]}</p>
                          <img src={`https://ipfs.io/ipfs/${hash[0]}`} alt=""/>
                        </div>
                      }
                  </div>
                )
              )}

              <h2>Upload Image</h2>
              <form onSubmit={this.onSubmit} >
                <input type='file' onChange={this.captureFile} /><br/>
                Title: <input type="text" name="title"/><br/>

                Accessibility:<br/>
                <input type="radio" id="private" name="acessibility" value="0"/>
                <label htmlFor="private">Private</label><br/>
                <input type="radio" id="public" name="acessibility" value="1" defaultChecked/>
                <label htmlFor="public">Public</label><br/>
                 
                <input type='submit' />
              </form>

              <h2>My Images</h2>
              {(this.state.myImages.length!==0) &&
                this.state.myImages.map( (hash,i) => (
                  hash[1] === this.state.account &&
                    <div key={i}>
                      <p> IPFS HASH: &nbsp; {hash[0]}</p>
                        {hash[0]!=="" && 
                          <div>
                            <p>Owner: &nbsp; {hash[1]}</p>
                            <p>Title: &nbsp; {hash[2]}</p>
                            <p>Accessibility: {hash[3]}</p>
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

              <h2>Remove access of my image from someone else</h2>
              <form onSubmit={this.removeImageAccess} >
                <input type='text' name='ipfsHash' placeholder='IPFS hash (remove later)'/><br/>
                <input type='text' name='senderAccount' placeholder='account'/><br/>
                <input type='submit'/>
              </form>

              <h2>Get Image Access Info</h2>
              <form onSubmit={this.getImageAcessInfo} >
                <input type='text' name='ipfsHash' placeholder='IPFS hash'/><br/>
                <input type='submit'/>
              </form>

              <h2>Images Shared with me</h2>
              {(this.state.shared.length!==0) &&
                this.state.shared.map( (hash,i) => (
                  <div key={i}>
                    <p> IPFS HASH: &nbsp; {hash[0]}</p>
                      {hash[0]!=="" && 
                        <div>
                          <p>Owner: &nbsp; {hash[1]}</p>
                          <p>Title: &nbsp; {hash[2]}</p>
                          <img src={`https://ipfs.io/ipfs/${hash[0]}`} alt=""/>
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
