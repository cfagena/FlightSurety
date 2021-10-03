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
  console.log(`accounts: ${accounts}`);

  await flightSuretyData.methods.authorizeContract(config.appAddress).send({ from: accounts[0], gas: config.gas })

  let result = await flightSuretyData.methods.isContractAuthorized(config.appAddress).call({ from: accounts[0] });

  console.log(`result: ${result}`);

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


