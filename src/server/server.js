import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import "babel-polyfill";

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    console.log(event)
});

async function registerOracles() {
  const accounts = await web3.eth.getAccounts();
  const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

  for (let i = 10; i < 30; i++) {
    console.log(i);
    await flightSuretyApp.methods.registerOracle().send({value: fee, from: accounts[i], gas: 3000000});
  }
}
    
registerOracles();

flightSuretyApp.events.allEvents({fromBlock: 'latest'}, 
  function (error, event) {
    if (error) console.log(error);
    else console.log(event);
  });

flightSuretyData.events.allEvents({fromBlock: 'latest'}, 
  function (error, event) {
    if (error) console.log(error);
    else console.log(event);
  });

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
});

export default app;


