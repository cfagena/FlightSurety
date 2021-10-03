
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`if app contract is authorized`, async function () {

    let status = await config.flightSuretyData.isContractAuthorized.call(config.flightSuretyApp.address);
    console.log("isContractAuthorized: " + status);
    assert.equal(status, true, "AppContract not authorized");

  });

  it(`if random address is not authorized`, async function () {

    let status = await config.flightSuretyData.isContractAuthorized.call(config.testAddresses[7]);
    assert.equal(status, false, "Incorrect initial operating status value");

  });


  it(`set operation false has correct isOperational() value`, async function () {

    await config.flightSuretyData.setOperatingStatus(false, { from: config.owner });
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, false, "Incorrect operating status value");

  });

  it(`block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it(`registerFlight test`, async function () {
 
    let result = await config.flightSuretyApp.registerFlight("GOL123", { from: config.firstAirline });
    truffleAssert.eventEmitted(result, 'FlightRegistered', { flightCode: "GOL123"});

});


});
