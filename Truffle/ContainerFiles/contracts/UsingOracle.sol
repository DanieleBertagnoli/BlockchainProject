// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title UsingOracle
 * @dev Abstract contract to define a callback function for Oracle contracts.
 */
abstract contract UsingOracle 
{

    /**
     * @dev Abstract function to be implemented by contracts using the Oracle.
     * @param _verifiedUser The address of the verified user.
     */
    function _callback(address _verifiedUser) virtual public;
}
