const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {
    let firstAirline = '0x57f3959cF94a388c6Ac64c0F0d6F84Fe5B8F4Ed6';
    deployer.deploy(FlightSuretyData, firstAirline)
    .then( () => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
                .then(async () => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:7545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');

                    accounts = web3.eth.getAccounts();
                    let flightSuretyData = await FlightSuretyData.new(firstAirline);
                    flightSuretyData.authorizeContract(FlightSuretyApp.address);
                });
    });
}