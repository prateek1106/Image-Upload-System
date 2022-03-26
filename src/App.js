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
      web3: null,
      buffer: null,
      account: null
    }
    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
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

  instantiateContract() {

    const contract = require('truffle-contract')
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(this.state.web3.currentProvider)

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      simpleStorage.deployed().then((instance) => {

        this.simpleStorageInstance = instance
        this.setState({ account: accounts[0] })

        //Getting the IPFS Hash String array
        console.log('Requesting for IPFS Hashes String Array:');
        console.log(this.simpleStorageInstance.getIpfsHashes.call(accounts[0]));

        return this.simpleStorageInstance.getIpfsHashes.call(accounts[0])
      }).then((ipfsHash) => {
        // Update state with the result.
        
       // console.log(ipfsHash.length);
        let hashes_array = [];
        
        for (var j = 0; j < ipfsHash.length ; j++) {
          let latesthash = "";
          for (var i = 0; i < ipfsHash[j].length; i++) {
            let num = ipfsHash[j][i].c[0];
            if(num!==0){
              latesthash+=(String.fromCharCode(num))
            }
          }

          hashes_array.push(latesthash);
        }

        return this.setState({ ipfsHashes : hashes_array });
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

    //Sending buffer to IPFS and getting result hash
    ipfs.files.add(this.state.buffer, (error, result) => {
      if(error) {
        console.error(error)
        return
      }

      //Iterating over IPFS Hash
      let str = result[0].hash;
      let ascii_hash = [];

      for (var i = 0; i < str.length; i++) {
        //console.log(str.charAt(i));
        //console.log(str.charAt(i).charCodeAt(0));
        ascii_hash.push(str.charAt(i).charCodeAt(0));
      }

      console.log(ascii_hash);

      //Appending IPFS Hash to String Array on Blockchain

      this.simpleStorageInstance.pushToIpfsHashes(ascii_hash, { from: this.state.account }).then((r) => {
        console.log('ifpsHash Push to Array', result[0].hash)
        return this.setState({ ipfsHash: result[0].hash })
      })
      
    })
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">IPFS Image Upload System</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Your Image</h1>
              <p>These images are stored on IPFS & The Ethereum Blockchain!</p>

              {this.state.ipfsHashes.length!==0 && 
                this.state.ipfsHashes.map( (hash,i) => (
                  <div key={i}>
                    <p> IPFS HASH: &nbsp; {hash}</p>
                      {hash!=="" && 
                        <img src={`https://ipfs.io/ipfs/${hash}`} alt=""/>
                      }
                  </div>
                )
              )}

              <h2>Upload Image</h2>
              <form onSubmit={this.onSubmit} >
                <input type='file' onChange={this.captureFile} />
                <input type='submit' />
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
