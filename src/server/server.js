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

// uint8 private constant STATUS_CODE_UNKNOWN = 0;
// uint8 private constant STATUS_CODE_ON_TIME = 10;
// uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
// uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
// uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
// uint8 private constant STATUS_CODE_LATE_OTHER = 50;

const statusCodes = [0, 10, 20, 30, 40, 50];

let oracles = [];
let accounts = [];
let owner = null;

function registerOracles() {
  flightSuretyApp.methods
    .REGISTRATION_FEE().call((error, result) => {
      oracles.forEach( oracle => {
        flightSuretyApp.methods
                .registerOracle()
                .send({value: result, from: oracle.address, gas: 3000000}, (error, result) => {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log(result);
                  }
                });
      }); 
    });
}

function getOracleIndexes() {
  oracles.forEach( oracle => {
    console.log(oracle.address);

    flightSuretyApp.methods
      .getMyIndexes()
      .call({from: oracle.address}, (error, result) => {
        if (error) {
          console.log(error);
        } else {
          console.log(`oracle: ${oracle.address} / indices: ${result}`);
          oracle["indices"] = result;
        }
      });
    });
  }

web3.eth.getAccounts((error, acct) => {
  accounts = acct;
  owner = acct[0];

  for (let i = 10; i < 30; i++) {
    let oracle = {
      address: accounts[i],
    };
    oracles.push(oracle);
  }
  
  registerOracles();
  getOracleIndexes();
});

function getRandomStatusCode() {
  const random = Math.floor(Math.random() * statusCodes.length);
  console.log(random, statusCodes[random]);
  return statusCodes[random];
}

flightSuretyApp.events.OracleRequest({fromBlock: 'latest'}, 
  function (error, event) { 
    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;

    console.log(`>>>> index: ${index}, airline: ${airline}, flight: ${flight}, timestamp: ${timestamp},`);

    // oracles.forEach( oracle => {
    //   if (oracle.indices.includes(index)) {
    //     flightSuretyApp.methods
    //       .submitOracleResponse(index, airline, flight, timestamp, getRandomStatusCode())
    //       .send({from: oracle.address}, (error, result) => {    
    //         if (error) {
    //           console.log(error);
    //         } else {
    //           console.log(result);
    //         }
    //     });
    //   }
    // });
});

// flightSuretyApp.events.allEvents({fromBlock: 'latest'}, 
//   function (error, event) {
//     if (error) console.log(error);
//     else console.log(event);
//   });

// flightSuretyData.events.allEvents({fromBlock: 'latest'}, 
//   function (error, event) {
//     if (error) console.log(error);
//     else console.log(event);
//   });

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
});

export default app;


