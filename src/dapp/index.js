
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {
    let contract = new Contract('localhost', () => {

        DOM.elid('passenger-id').textContent = contract.passenger;

        contract.flightSuretyApp.events.allEvents({fromBlock: 'latest'}, 
        function (error, event) {
            if (error) console.log(error);
            else console.log(event);
        });

        contract.flightSuretyData.events.allEvents({fromBlock: 'latest'}, 
        function (error, event) {
            if (error) console.log(error);
            else console.log(event);
        });

        
        // Read transaction
        function isOperational() {
            contract.isOperational((error, result) => {
                //console.log(error,result);
    
                let displayDiv = DOM.elid("op-status");
                let button = DOM.elid("toggle-operational");
    
                if (result) {
                    displayDiv.textContent = "Up & Running";
                    button.textContent = "Pause";
    
                } else {
                    displayDiv.textContent = "Down";
                    button.textContent = "Run";
                }
            });
        }   

        DOM.elid('check-operational').addEventListener('click', () => {
            isOperational();
        });

        DOM.elid('toggle-operational').addEventListener('click', () => {
            var operational = false;
            if ("Up & Running" == DOM.elid("op-status").textContent) {
                operational = false;
            } else {
                operational = true;
            }
            contract.toggleOperatingStatus(operational, (result) => {
                console.log(result);
                isOperational();
            });
        });
    
        // User-submitted transaction
        // DOM.elid('submit-oracle').addEventListener('click', () => {
        //     let flight = DOM.elid('flight-number').value;
        //     contract.fetchFlightStatus(flight, (error, result) => {
        //         display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
        //     });
        // })

        DOM.elid('register-flight-1').addEventListener('click', () => {
            contract.registerFlight('FA1111', contract.airlines[0], (error) => {
                console.log(error);
            });
        })

        DOM.elid('register-flight-2').addEventListener('click', () => {
            contract.registerFlight('LT0001', contract.airlines[1], (error) => {
                console.log(error);
            });
        })

        DOM.elid('register-airline-2').addEventListener('click', () => {
            contract.registerAirline(contract.airlines[1], (response) => {
                console.log(response);
            });
        })    

        DOM.elid('submit-fund-2').addEventListener('click', () => {
            contract.fundAirline(contract.airlines[1], (response) => {
                console.log(response);
            });
        }) 

        DOM.elid('get-status-1').addEventListener('click', () => {
            contract.getAirlineStatus(contract.airlines[0], (response) => {
                console.log(response);
                DOM.elid('airline-1-status').textContent = response;
            });
        }) 
        
        DOM.elid('get-status-2').addEventListener('click', () => {
            contract.getAirlineStatus(contract.airlines[1], (response) => {
                console.log(response);
                DOM.elid('airline-2-status').textContent = response;
            });
        }) 

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let insuranceValue = Number(DOM.elid('insurance-value').value);
            let flightCode = DOM.elid('flight-select').value;

            console.log(`insuranceValue: ${insuranceValue}/flightCode: ${flightCode}/`);

            if (flightCode == "0") {
                DOM.elid('flight-error').classList.remove("invisible");
                DOM.elid('flight-error').classList.add("visible");
                return;
            } else {
                DOM.elid('flight-error').classList.add("invisible");
                DOM.elid('flight-error').classList.remove("visible");
            }

            if(isNaN(insuranceValue) || insuranceValue <= 0 || insuranceValue > 1){
                DOM.elid('value-error').classList.remove("invisible");
                DOM.elid('value-error').classList.add("visible");
                return;
            } else {
                DOM.elid('value-error').classList.add("invisible");
                DOM.elid('value-error').classList.remove("visible");
            }

            contract.buyInsurance(flightCode, contract.passenger, insuranceValue, (response) => {
                console.log(response);
            });
        }) 

        DOM.elid('submit-to-oracles').addEventListener('click', () => {
            let flightCode = DOM.elid('flight-select').value;
            contract.fetchFlightStatus(flightCode, contract.airlines[1], contract.passenger, (error, response) => {
                console.log(response);
            });
        }) 
 
        isOperational();
        
    });
    
})();

function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







