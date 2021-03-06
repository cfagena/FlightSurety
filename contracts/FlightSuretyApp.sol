// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    uint256 public constant AIRLINE_REGISTRATION_FEE = 10 ether;

    address private contractOwner;          // Account used to deploy contract
    FlightSuretyData dataContract;

    bool private operationalFlag  = false;
    
    // Event definitions
    event AirlineCandidate(address account);
    event AirlineRegistered(address account);
    event AirlineParticipant(address account);
    event AirlineVoted(address airline);
    event FlightRegistered(string flightCode);
    event OracleRegistered(address account);
    event AccountWithdraw(address passenger, uint256 balance);

    event Log(string first, string second);
 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(operationalFlag, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires a registered airline to be the function caller
    */
    modifier requireRegisteredAirline()
    {
        require(dataContract.isRegisteredAirline(msg.sender), "Airline is not registered");
        _;
    }

    /**
    * @dev Modifier that requires a registered airline to be the function caller
    */
    modifier requireParticipantAirline()
    {
        require(dataContract.isParticipantAirline(msg.sender), "Airline is not participant");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor (address dataContractAddress) {
        contractOwner = msg.sender;
        operationalFlag = true;
        dataContract = FlightSuretyData(dataContractAddress);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns(bool) {
        return operationalFlag;  // Modify to call data contract's status
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus(bool mode) external requireContractOwner {
        operationalFlag = mode;      
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline(address newAirline) external
    requireIsOperational
    requireRegisteredAirline
    returns(bool success, uint256 votes) {

        require(newAirline != address(0), "newAirline is not a valid address.");
        require(!dataContract.hasAirlineRecord(newAirline), "Airline is already submitted.");

        if (dataContract.getAmountRegisteredAirlines() < 4) {
            dataContract.registerAirline(newAirline, true, false);
            emit AirlineRegistered(newAirline);
            return (true, 0);
        }

        dataContract.registerAirline(newAirline, false, false);
        emit AirlineCandidate(newAirline);
        
        return (false, 0);
    }


    /**
    * @dev Vote to register an airline
    *
    */   
    function voteToAirline(address airline) external
    requireIsOperational
    requireRegisteredAirline
    returns(bool success) {
        
        require(airline != address(0), "airline is not a valid address.");
        require(!dataContract.isRegisteredAirline(airline), "Airline is already registered");
        require(!dataContract.callerVotedToAirline(msg.sender, airline), "Caller already voted for this Airline");

        dataContract.addVote(airline, msg.sender);

        uint256 votes = dataContract.getCandidateNumVotes(airline);
        emit Log("Votes", uint2str(votes));
        uint256 amountRegisteredAirlines = dataContract.getAmountRegisteredAirlines();
        emit Log("amountRegisteredAirlines", uint2str(amountRegisteredAirlines));

        if (votes >= amountRegisteredAirlines/2) {
            dataContract.updateAirlineStatus(airline, true, false);
            emit AirlineRegistered(airline);
            return true;
        } else {
            emit AirlineVoted(airline);
            return true;
        }
    }

    function fund() public payable 
    requireIsOperational
    requireRegisteredAirline {

        require(msg.value == 10 ether, "Initial fund should be 10 ether");
        require(!dataContract.isParticipantAirline(msg.sender), "Initial fund already paid");

        dataContract.updateAirlineStatus(msg.sender, true, true);
        emit AirlineParticipant(msg.sender);        
    }

    function getAirlineStatus(address airline) public  
    requireIsOperational 
    returns(string memory status) {
        return dataContract.getAirlineStatus(airline);
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight (string memory flightCode) external
    requireIsOperational
    requireParticipantAirline {

        require(!dataContract.isFlightRegistered(flightCode), "Flight code is already registered");

        if (dataContract.registerFlight(flightCode, msg.sender) == true) {
            emit FlightRegistered(flightCode);
        }
    }

    /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(string memory flightCode) external payable 
    requireIsOperational
    returns(bool success, bytes32 _key) {
        require((msg.value > 0) && (msg.value <= 1 ether), "Insurance value should be into the interval ]0,1]");
        require(dataContract.isFlightRegistered(flightCode), "Flight is not registered");
        require(!dataContract.isInsurancePurchased(flightCode, msg.sender), "Insurance already purchased for this flight and passenger");
    
        return dataContract.buy(msg.sender, flightCode, msg.value);
    } 

    /**
    * @dev Get flight status
    *
    */   
    function getFlightStatus(string memory flightCode) external view returns(uint8 statusCode){
        return dataContract.getFlightStatus(flightCode);
    } 

    
    /**
    * @dev Get passanger balance
    *
    */   
    function getPassengerBalance() external view returns(uint256 balance){
        return dataContract.getPassengerBalance(msg.sender);
    } 

    /**
    * @dev Get flight status
    *
    */   
    function withdraw() external payable 
    requireIsOperational
    returns(bool success){
        uint256 balance = dataContract.pay(msg.sender);

        payable(msg.sender).transfer(balance);
        emit AccountWithdraw(msg.sender, balance);
        return true;
    } 

   /**
    * @dev Called after oracle has updated flight status
    * Assumptions made: 
    * 1. Only if the status is UNKNOWN it can be updated, otherwise it will be consider as final state
    * 2. The first time the status reaches a final state then it becomes immutable - following calls to this method will be ignored
    */  
    function processFlightStatus (address airline, string memory flightCode, uint256 timestamp, uint8 statusCode) internal {
        require(dataContract.getFlightStatus(flightCode) == STATUS_CODE_UNKNOWN, "Flight already processed");

        dataContract.updateFlightStatus(flightCode, statusCode);

        emit ProcessFlightStatus(airline, flightCode, timestamp, statusCode);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus (address airline, string memory flight, uint256 timestamp) 
        requireIsOperational external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        
        ResponseInfo storage auxResponseInfo = oracleResponses[key];
        auxResponseInfo.requester = msg.sender;
        auxResponseInfo.isOpen = true;

        emit OracleRequest(index, airline, flight, timestamp);
    } 


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);
    
    event ProcessFlightStatus(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        require(!oracles[msg.sender].isRegistered, "Oracle already registered");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });

        emit OracleRegistered(msg.sender);
    }

    function getMyIndexes () view external
    returns(uint8[3] memory index) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse (uint8 index, address airline, string memory flight, uint256 timestamp, uint8 statusCode) external {
        require((oracles[msg.sender].indexes[0] == index) 
            || (oracles[msg.sender].indexes[1] == index) 
            || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey (address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes (address account) internal 
    returns(uint8[3] memory index) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex (address account) internal 
    returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion
}  
