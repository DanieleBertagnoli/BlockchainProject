// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UsingOracle.sol";

/**
 * @title DragonBlockOracle
 * @dev An Oracle contract to verify users based on votes from other users.
 */
contract DragonBlockOracle {

    // Struct to represent an Oracle request
    struct OracleRequest 
    {
        bool done;
        uint256 yesVote;
        uint256 noVote;
        address userToVerify;
        address callerContract;
    }

    mapping(address => bool) private verifiedUsers; // Mapping to store whether an address is a verified user

    mapping(uint256 => mapping(address => bool)) voters; // Mapping to track whether a user has voted for a specific request

    OracleRequest[] public requests; // Array to store Oracle requests

    event UserVerification(address indexed userAddress, uint256 requestId); // Event emitted when a user is verified

    address public minter; // Address of the contract creator (minter)



    /**
     * @dev Constructor function to initialize the contract.
     * The contract creator (minter) is marked as a verified user.
     */
    constructor() 
    {
        minter = msg.sender;
        verifiedUsers[msg.sender] = true;
    }



    /**
     * @dev Initiates a user verification request.
     * @param _userAddress The address of the user to be verified.
     * @param _callerContract The address of the contract initiating the verification request.
     */
    function verifyUser(address _userAddress, address _callerContract) public 
    {
        // Create a new Oracle request and push it to the array
        requests.push(OracleRequest({
            done: false,
            yesVote: 0,
            noVote: 0,
            userToVerify: _userAddress,
            callerContract: _callerContract
        }));

        emit UserVerification(_userAddress, requests.length - 1); // Emit an event indicating the user verification request
    }



    /**
     * @dev Allows users to vote on a user verification request.
     * @param _requestId The ID of the verification request.
     * @param _vote The vote (true for yes, false for no).
     */
    function vote(uint256 _requestId, bool _vote) public 
    {
        OracleRequest storage request = requests[_requestId]; // Get the Oracle request from the array

        // Require that the voter is a verified user and has not voted before
        require(verifiedUsers[msg.sender], "You are not a verified user!");
        require(!voters[_requestId][msg.sender], "You have already voted!");

        if (!request.done) // Check if the request is not already marked as done 
        {
            voters[_requestId][msg.sender] = true; // Mark the user as voted for this request

            if (_vote) // Update vote counts based on the user's vote
            { request.yesVote += 1; } 
            else 
            { request.noVote += 1; }

            // If enough 'yes' votes, mark the user as verified and trigger callback in the caller contract
            if (request.yesVote >= 1) 
            {
                verifiedUsers[request.userToVerify] = true;
                request.done = true;
                UsingOracle caller = UsingOracle(request.callerContract);
                caller._callback(request.userToVerify);
            }

            // If enough 'no' votes, mark the user as not verified
            if (request.noVote >= 1) 
            {
                verifiedUsers[request.userToVerify] = false;
                request.done = true;
            }
        }
    }

    /**
     * @dev Public function for the contract creator to terminate the contract and withdraw funds
     */
    function terminate() public 
    {
        require(msg.sender == minter, "You cannot terminate the contract!");
        payable(minter).transfer(address(this).balance);
    }
}
