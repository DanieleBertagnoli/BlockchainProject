// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UsingOracle.sol";
import "./DragonBlockOracle.sol";

/**
 * @title DragonBlock Smart Contract
 * @dev A decentralized crowdfunding platform where users can create campaigns, donate, and vote using SuperSaiyan (SSJ) tokens.
 */
contract DragonBlockDEMO is UsingOracle 
{
    // Enum to represent different statuses of a campaign
    enum CampaignStatus 
    {
        PENDING,
        ACTIVE,
        DISAPPROVED,
        REVISION,
        BANNED,
        ENDED
    }

    // Struct to represent a campaign
    struct Campaign 
    {
        address owner;          // Address of the campaign owner
        uint256 id;             // Unique identifier for the campaign
        CampaignStatus status;  // Current status of the campaign
        uint256 weiLimit;       // Maximum amount of ETH that can be donated to the campaign
        uint256 donatedWei;     // Total ETH donated to the campaign
        uint256 creationTime;   // Timestamp when the campaign was created
        uint256 revisionTime;   // Timestamp when the campaign entered the revision state
        uint16 weekDuration;    // Duration of the campaign in weeks
    }

    event CampaignCreation(uint256 campaignId); // Event to notify the campaign creation returning its ID

    Campaign[] public campaigns; // Array to store all campaigns

    mapping(address => uint) public dstBalances; // Mapping to track DST balances of users (Key: address of the user)

    mapping(address => uint256) public ssjVaults; // Mapping to track users who are part of the SuperSaiyan Set (Key: address of the user)

    // Mapping to store addresses that approved or disapproved a campaign (Key: campaign ID)
    mapping(uint256 => address[]) private campaignApprovals; 
    mapping(uint256 => address[]) private campaignDisapprovals;

    // Mapping to store addresses that approved or disapproved a revisioned campaign (Key: campaign ID)
    mapping(uint256 => address[]) private campaignRevisionApprovals;
    mapping(uint256 => address[]) private campaignRevisionDisapprovals;

    mapping(uint256 => address[]) private campaignReports; // Mapping to store addresses that reported a campaign (Key: campaign ID)

    mapping(address => bool) public verifiedUsers; // Mapping to track of users who are already been verified (Key: address of the user)

    // Struct to represent a donation
    struct Donation 
    {
        address donator;
        uint256 donatedWei;
    }

    mapping (uint256 => Donation[]) private donators; // Mapping to track of donations made to a certain campaign (Key: campaign ID)

    address public minter; // Address of the contract creator

    DragonBlockOracle private oracle; // DragonBlockOracle instance


    /**
     * @dev Modifier to check if the caller is a verified user.
     */
    modifier isVerified() 
    {
        // Check if the caller is a verified user
        require(verifiedUsers[msg.sender], "You are not a verified user!");
        _;  // Continue with the function execution if the check passes
    }



    /**
     * @dev Modifier to check if the caller is part of the SuperSaiyan Set.
     */
    modifier isSSJ() 
    {
        // Check if the caller is part of the SuperSaiyan Set
        require(ssjVaults[msg.sender] > 0, "You are not a SSJ!");
        _;  // Continue with the function execution if the check passes
    }



    /**
     * @dev Modifier to check if the caller has not voted on a specific campaign.
     * @param _id The ID of the campaign for which the caller's vote is being checked.
     */
    modifier hasNotVoted(uint256 _id) 
    {
        // Check if the caller has not already voted on the campaign
        require(!addressInArray(msg.sender, campaignApprovals[_id]), "You have already approved this campaign");
        require(!addressInArray(msg.sender, campaignDisapprovals[_id]), "You have already disapproved this campaign");
        _;  // Continue with the function execution if the check passes
    }



    /**
     * @dev Constructor to initialize the contract
     * @param _oracleAddress Address of the DragonBlockOracle contract
     */
    constructor(address _oracleAddress) 
    {
        minter = msg.sender; // Initialize DST balance for a default address
        dstBalances[msg.sender] = 1000;
        oracle = DragonBlockOracle(_oracleAddress);
        //verifiedUsers[msg.sender] = true;
    }



    /**
     * @dev Callback function triggered by the Oracle contract upon user verification.
     * @param _verifiedUser The address of the verified user.
     */
    function _callback(address _verifiedUser) override public 
    { verifiedUsers[_verifiedUser] = true; }



    /**
     * @dev Checks if an address exists in a given array of addresses.
     * @param _address The address to be checked for existence in the array.
     * @param _listOfAddresses The array of addresses in which the existence is to be checked.
     * @return bool A boolean indicating whether the address exists in the array (true) or not (false).
     * @dev The function iterates through the array to find if the specified address matches any element.
     * @dev Returns true if the address is found in the array, otherwise returns false.
     */
    function addressInArray(address _address, address[] storage _listOfAddresses) private view returns(bool) 
    {
        for (uint i = 0; i < _listOfAddresses.length; i++) // Loop on the elements
        {
            if (_listOfAddresses[i] == _address) // If we found the address
            { return true; }
        }
        return false;
    }



    /**
     * @dev Slashes SuperSaiyan (SSJ) users who approved a campaign, reducing their vault ETH balance and DST balance.
     * @param _campaignID The unique identifier of the campaign for which SSJ users are to be slashed.
     * @dev The function iterates through the list of users who approved the specified campaign and slashes their SSJ status.
     * @dev Slashing involves deducting 0.025 ETH from the user's SSJ vault and 10 DST from their balance.
     * @dev If the user's SSJ vault or DST balance falls below a certain threshold, their SSJ status is revoked, and remaining ETH is returned.
     */
    function slashSSJUsers(uint256 _campaignID) private 
    {
        for (uint i = 0; i < campaignApprovals[_campaignID].length; i++) // Loop on the users who have approved the campaign to slash them
        {
            address slashedUser = campaignApprovals[_campaignID][i];
            ssjVaults[slashedUser] -= 0.025 ether; // Remove 0.025 ETH from the vault
            dstBalances[slashedUser] -= 10; // Remove 10 DST from the balance
            
            if (ssjVaults[slashedUser] < 0.05 ether || dstBalances[slashedUser] < 500) // If the user has not enough DST or ETH in the vault
            {
                address payable user = payable(slashedUser);
                user.transfer(ssjVaults[slashedUser]);
                ssjVaults[slashedUser] = 0; // The user is no longer a SSJ
            }
        }
    }



    /**
     * @dev Rewards SuperSaiyan (SSJ) users based on their approval or disapproval of a campaign.
     * @param _campaignID The unique identifier of the campaign for which SSJ users are to be rewarded.
     * @dev The function checks the status of the specified campaign and rewards SSJ users accordingly.
     * @dev If the campaign has been banned, it rewards users who disapproved the campaign while it was pending or in revision.
     * @dev If the campaign has ended, it rewards users who approved the campaign while it was pending or in revision, based on the completion percentage.
     * @dev Rewards are distributed proportionally among users based on their contribution to the disapproval or approval process.
     */
    function rewardSSJUsers(uint256 _campaignID) private 
    {
        // If the campaign has been banned, reward users who have disapproved the campaign while was pending or while was in revision
        if(campaigns[_campaignID].status == CampaignStatus.BANNED) 
        {   
            for (uint i = 0; i < campaignDisapprovals[_campaignID].length; i++) // Reward the users who have disapprove the campaign while was pending
            {
                address rewardedUser = campaignDisapprovals[_campaignID][i];
                ssjVaults[rewardedUser] += (campaigns[_campaignID].weiLimit * 5 / 100) / (campaignDisapprovals[_campaignID].length + campaignRevisionDisapprovals[_campaignID].length);
            }

            for (uint i = 0; i < campaignRevisionDisapprovals[_campaignID].length; i++) // Reward the users who have disapprove the campaign while was in revision
            {
                address rewardedUser = campaignRevisionDisapprovals[_campaignID][i];
                ssjVaults[rewardedUser] += (campaigns[_campaignID].weiLimit * 5 / 100) / (campaignDisapprovals[_campaignID].length + campaignRevisionDisapprovals[_campaignID].length);
            }
        }

        // If the campaign has been banned, reward users who have approved the campaign while was pending or while was in revision
        if(campaigns[_campaignID].status == CampaignStatus.ENDED) 
        {
            // Users are rewarded if the completion percentage is higher than 5%
            uint percentage = campaigns[_campaignID].donatedWei * 100 / campaigns[_campaignID].weiLimit; 
            if (percentage <= 5) 
            { return; }

            uint rewardToSplit = campaigns[_campaignID].weiLimit * 5 / 100 * percentage / 100; // Reward to be splitted among the users

            for (uint i = 0; i < campaignApprovals[_campaignID].length; i++) // Reward the users who have disapprove the campaign while was pending
            {
                address rewardedUser = campaignApprovals[_campaignID][i];
                ssjVaults[rewardedUser] += rewardToSplit / (campaignApprovals[_campaignID].length + campaignRevisionApprovals[_campaignID].length);
            }

            for (uint i = 0; i < campaignRevisionApprovals[_campaignID].length; i++) // Reward the users who have disapprove the campaign while was in revision
            {
                address rewardedUser = campaignRevisionApprovals[_campaignID][i];
                ssjVaults[rewardedUser] += rewardToSplit / (campaignApprovals[_campaignID].length + campaignRevisionApprovals[_campaignID].length);
            }
        }
    }



    /**
     * @dev Rewards users who reported a campaign during the revision phase.
     * @param _campaignID The unique identifier of the campaign for which reporters are to be rewarded.
     * @dev The function iterates through the list of users who reported the specified campaign during the revision phase.
     * @dev Each user is rewarded with 2 DST added to their balance.
     */
    function rewardReporters(uint256 _campaignID) private 
    {
        for (uint i = 0; i < campaignReports[_campaignID].length; i++) // Reward the users who have reported the campaign while was in revision
        {
            address rewardedUser = campaignReports[_campaignID][i];
            dstBalances[rewardedUser] += 2; // Add 2 DST to their balance
        }
    }



    /**
     * @dev Refunds the donated funds to the users who contributed to a specific campaign.
     * @param _campaignID The unique identifier of the campaign for which the refund is to be processed.
     * @dev The function iterates through the list of donators for the specified campaign and transfers the donated funds back to each donator.
     * @dev This function is used in scenarios where a campaign is banned and funds need to be returned to the donators.
     */
    function refundDonators(uint256 _campaignID) private 
    {
        for (uint i = 0; i < donators[_campaignID].length; i++) // Iterate through the list of donators for the specified campaign
        {
            address payable user = payable(donators[_campaignID][i].donator); // Retrieve the donator's address
            user.transfer(donators[_campaignID][i].donatedWei); // Transfer the donated funds back to the donator
        } 
    }



    /**
     * @dev Verifies a user by interacting with the DragonBlock Oracle.
     * @dev Checks if the caller's address is not already verified and initiates the verification process through the DragonBlock Oracle.
     * @dev If the caller's address is not verified, the function calls the `verifyUser` function on the DragonBlock Oracle contract.
     */
    function verifyUser() public 
    {
        if (!verifiedUsers[msg.sender]) // Check if the caller's address is not already verified
        { oracle.verifyUser(msg.sender, address(this)); } // Initiate the verification process through the DragonBlockOracle
    }



    /**
     * @dev Retrieves the combat level of a user based on their DST balance.
     * @param _user The address of the user for whom the combat level is to be calculated.
     * @return uint256 representing the combat level of the user.
     * @dev Calculates the combat level by multiplying the user's DST balance by 10.
     * @dev If the resulting combat level is greater than or equal to 9000, the function returns 9000.
     * @dev Otherwise, it returns the calculated combat level based on the user's DST balance.
     */
    function getUserCombatLvl(address _user) public view returns (uint256) 
    {
        uint256 combatLevel = dstBalances[_user] * 10; // Calculate the combat level by multiplying the user's DST balance by 10

        if (combatLevel >= 9000) // If the combat level is greater than or equal to 9000, return 9000
        { return 9000; } 
        else // Return the calculated combat level based on the user's DST balance
        { return combatLevel; }
    }



    /**
     * @dev Creates a new campaign with specified donation limit and duration.
     * @param _weiLimit The donation limit for the campaign, expressed in ETH.
     * @param _weekDuration The duration of the campaign in weeks.
     * @dev The function performs various validations to ensure the correctness of input parameters and the user's combat level.
     * @dev If all validations pass, a new campaign is created with the specified details, and the campaign ID is emitted through an event.
     */
    function createCampaign(uint256 _weiLimit, uint16 _weekDuration) isVerified() public payable 
    {
        require(msg.value == _weiLimit * 5 / 100, "You have to deposit 5% of the weiLimit!"); // Require that the sender deposits 5% of the weiLimit
        require(_weiLimit > 0.05 ether, "The donation limit must be greater than 0.05 ETH"); // Require that the donation limit is greater than 0.05 ETH
        require(_weiLimit % 0.005 ether == 0, "The donation limit must be a multiple of 0.005 ETH"); // Require that the donation limit is a multiple of 0.005 ETH
        require(_weiLimit <= 0.1 ether * getUserCombatLvl(msg.sender), "Your combat level is too low for the requested ETH!"); // Require that the donation limit is within the combat level threshold
        require(_weekDuration > 8, "The campaign duration (expressed in weeks) must be greater than 8"); // Require that the campaign duration is greater than 8 weeks

        // Create a new campaign with the specified details
        campaigns.push(
            Campaign({
                owner: msg.sender,
                id: campaigns.length, 
                status: CampaignStatus.PENDING,
                weiLimit: _weiLimit,
                donatedWei: 0,
                creationTime: block.timestamp,
                revisionTime: 0,
                weekDuration: _weekDuration
            })
        );

        emit CampaignCreation(campaigns.length-1); // Emit an event indicating the creation of a new campaign with its ID
    }



    /**
     * @dev Retrieves a window of campaigns based on the specified window size.
     * @param _campaignWindow The size of the campaign window to retrieve.
     * @return An array of Campaign structs representing the campaigns within the specified window.
     * @dev The function performs validations to ensure a valid window size and calculates the starting index for the window.
     * @dev It then creates a memory array to store the window of campaigns and copies the elements to the result array.
     * @dev The result array contains a maximum of 20 campaigns, or fewer if there are fewer campaigns than the window size.
     */
    function getCampaigns(uint256 _campaignWindow) public view returns (Campaign[] memory) 
    {
        require(_campaignWindow > 0, "Window size must be greater than 0"); // Require that the window size is greater than 0
        require(int256(campaigns.length) - int256(_campaignWindow-1) * 20 >= 0, "The window size is too large"); // Require that the window size is within the available campaigns

        // Calculate the starting index for the window
        int256 startIndex = int256(campaigns.length) - int256(_campaignWindow) * 20;
        if (startIndex < 0) 
        { startIndex = 0; }

        uint256 numElements = uint256(startIndex + 20) <= campaigns.length ? 20 : campaigns.length - uint256(startIndex); // Calculate the actual number of elements to include in the result

        Campaign[] memory result = new Campaign[](numElements); // Create a memory array to store the window of elements

        for (uint256 i = 0; i < numElements; i++) // Use a loop to copy the elements to the result array
        { result[i] = campaigns[uint256(startIndex + int256(i))]; }

        return result; // Return the array of campaigns within the specified window
    }



    /**
     * @dev Retrieves an array of campaigns owned by the specified address.
     * @param _owner The address of the owner for whom to retrieve owned campaigns.
     * @return An array of Campaign structs representing the campaigns owned by the specified address.
     * @dev The function counts the number of campaigns owned by the specified address, creates an array to hold the owned campaigns, and populates the array with the owned campaigns.
     * @dev The result array contains all campaigns owned by the specified address, or an empty array if there are no owned campaigns.
     */
    function getOwnedCampaigns(address _owner) public view returns (Campaign[] memory) 
    {
        uint256 ownedCampaignCount = 0; // Initialize a variable to count the number of campaigns owned by the specified address

        // Count the number of campaigns owned by the specified address
        for (uint256 i = 0; i < campaigns.length; i++) 
        {
            if (campaigns[i].owner == _owner) 
            { ownedCampaignCount++; }
        }

        Campaign[] memory ownedCampaigns = new Campaign[](ownedCampaignCount); // Create an array to hold the owned campaigns
        uint256 currentIndex = 0;

        // Populate the array with owned campaigns
        for (uint256 i = 0; i < campaigns.length; i++) 
        {
            if (campaigns[i].owner == _owner) 
            {
                ownedCampaigns[currentIndex] = campaigns[i];
                currentIndex++;
            }
        }

        return ownedCampaigns; // Return the array of campaigns owned by the specified address
    }


    
    /**
     * @dev Allows a user to donate to an active campaign.
     * @param _id The unique identifier of the campaign to which the user wants to donate.
     * @dev The function checks various conditions, such as campaign existence, active status, donation window, and donation amount validity.
     * @dev If all conditions are met, the function updates the campaign's donation details and the user's DST balance accordingly.
     * @dev The function also records the donation details, including the donator's address and the donated amount.
     * @dev The donation must be in increments of 0.0005 ETH.
     * @dev The donated amount is converted to DST based on the conversion rate of 0.0005 ETH to 1 DST.
     */
    function donateCampaign(uint256 _id) isVerified() public payable
    {
        require(_id < campaigns.length, "The specified campaign does not exist"); // Check if the specified campaign exists
        require(campaigns[_id].status == CampaignStatus.ACTIVE, "The specified campaign is not active"); // Check if the specified campaign is active
        require(block.timestamp <= campaigns[_id].creationTime + (campaigns[_id].weekDuration * 1 weeks), "The specified campaign is no longer active; the owner should finalize it"); // Check if the donation window for the campaign is still open
        require(campaigns[_id].weiLimit - campaigns[_id].donatedWei - msg.value >= 0, "The donation value is too high!"); // Check if the donation amount is within the allowed range
        require(msg.value > 0, "The donation must be greater than zero"); // Check if the donation amount is greater than zero
        require(msg.value % 0.0005 ether == 0, "You can donate only using steps of 0.0005 ETH"); // Check if the donation amount is in increments of 0.0005 ETH

        campaigns[_id].donatedWei += msg.value * 95 / 100; // Update the campaign's donatedWei field with the received donation (only the 95% is destinated as donation, 5% is kept in the contract for the fees)
        dstBalances[msg.sender] += msg.value / 0.0005 ether; // Convert the donated amount to DST based on the conversion rate of 0.0005 ETH to 1 DST

        // Record the donation details, including the donator's address and the donated amount
        donators[_id].push(Donation({
            donator: msg.sender,
            donatedWei: msg.value
        }));
    }



    /**
     * @dev Allows a user to report an active campaign.
     * @param _id The unique identifier of the campaign to be reported.
     * @dev The function checks various conditions, such as campaign existence, active status, and the user's DST balance.
     * @dev If all conditions are met, the function deducts 1 DST from the user, records the report, and checks if the campaign needs to enter the revision state.
     * @dev If more than one report is received, the campaign is marked as "REVISION" with the timestamp of the revision state.
     */
    function reportCampaign(uint256 _id) isVerified() public 
    {
        require(_id < campaigns.length, "The specified campaign does not exist"); // Check if the specified campaign exists
        require(campaigns[_id].status == CampaignStatus.ACTIVE, "The specified campaign is not active"); // Check if the specified campaign is active
        require(dstBalances[msg.sender] > 0, "You must have at least 1 DST"); // Check if the user has at least 1 DST to report the campaign

        dstBalances[msg.sender] -= 1; // Deduct 1 DST from the user's balance for reporting the campaign
        campaignReports[_id].push(msg.sender); // Record the user's report for the campaign

        // Check if more than one report has been received
        if (campaignReports[_id].length > 1) 
        {
            // If more than 100 report is received, mark the campaign as "REVISION" and record the revision timestamp
            campaigns[_id].status = CampaignStatus.REVISION;
            campaigns[_id].revisionTime = block.timestamp;
        }
    }



    /**
     * @dev Allows the owner of a pending campaign to finalize and determine its status.
     * @param _id The unique identifier of the campaign to be finalized.
     * @dev The function checks various conditions, such as campaign status, elapsed time, and ownership, before finalizing the campaign.
     * @dev If the campaign has more approvals than disapprovals, it is marked as "ACTIVE." Otherwise, it is marked as "DISAPPROVED."
     */
    function finalizeCampaign(uint256 _id) isVerified() public 
    {
        require(campaigns[_id].status == CampaignStatus.PENDING, "The specified campaign is not pending!"); // Check if the specified campaign is in the "PENDING" status
        require(block.timestamp > campaigns[_id].creationTime + 0 days, "You can finalize it after 7 days!"); // Check if at least 7 days have passed since the campaign creation for finalization
        require(msg.sender == campaigns[_id].owner, "You cannot finalize this campaign as you are not the owner!"); // Check if the caller is the owner of the campaign

        // Determine the campaign status based on approvals and disapprovals
        if (campaignApprovals[_id].length > campaignDisapprovals[_id].length) 
        { campaigns[_id].status = CampaignStatus.ACTIVE; } // If the campaign has more approvals than disapprovals, mark it as "ACTIVE"
        else 
        { campaigns[_id].status = CampaignStatus.DISAPPROVED; } // If the campaign has more disapprovals than approvals, mark it as "DISAPPROVED"
    }



    /**
     * @dev Allows the owner of an active campaign to terminate it, marking it as "ENDED."
     * @param _id The unique identifier of the campaign to be terminated.
     * @dev The function checks various conditions, such as campaign status, elapsed time, and ownership, before terminating the campaign.
     * @dev Upon termination, the campaign is marked as "ENDED," SSJ users are rewarded, and the remaining funds are transferred to the campaign owner.
     * @dev Additionally, approval and disapproval lists for revisioned campaigns are cleared to maintain data integrity.
     */
    function terminateCampaign(uint256 _id) isVerified() public 
    { 
        require(campaigns[_id].status == CampaignStatus.ACTIVE, "The specified campaign is not active!"); // Check if the specified campaign is in the "ACTIVE" status
        require(block.timestamp >= campaigns[_id].creationTime + (campaigns[_id].weekDuration * 0 days), "You can finalize it after 7 days!"); // Check if at least 7 days have passed since the campaign creation for termination
        require(msg.sender == campaigns[_id].owner, "You cannot terminate this campaign as you are not the owner!"); // Check if the caller is the owner of the campaign

        campaigns[_id].status = CampaignStatus.ENDED; // Mark the campaign as "ENDED"
        rewardSSJUsers(_id); // Reward SuperSaiyan (SSJ) users who participated in the campaign

        // Clear approval and disapproval lists for revisioned campaigns
        delete campaignRevisionApprovals[_id];
        delete campaignRevisionDisapprovals[_id];

        // Transfer the remaining funds to the campaign owner
        address payable campaignOwner = payable(campaigns[_id].owner);
        campaignOwner.transfer(campaigns[_id].donatedWei);
    }



    /**
     * @dev Allows the owner of a campaign in "REVISION" state to finalize it, updating its status.
     * @param _id The unique identifier of the campaign to be finalized.
     * @dev The function checks various conditions, such as campaign status, elapsed time, and ownership, before finalizing the campaign.
     * @dev If more approvals than disapprovals are received, the campaign status is updated to "ACTIVE."
     * @dev If disapprovals surpass approvals, the campaign is marked as "BANNED," and associated actions (slashing SSJ users, rewarding reporters, rewarding SSJ users, refunding donators) are performed.
     * @dev Approval and disapproval lists for revisioned campaigns are cleared to maintain data integrity.
     */
    function finalizeRevisionCampaign(uint256 _id) isVerified() public 
    {
        require(campaigns[_id].status == CampaignStatus.REVISION, "The specified campaign is not in revision!"); // Check if the specified campaign is in the "REVISION" status
        require(block.timestamp >= campaigns[_id].revisionTime + (0 days), "You can finalize it after 7 days!"); // Check if at least 7 days have passed since the revision started for finalization
        require(msg.sender == campaigns[_id].owner, "You cannot finalize this campaign as you are not the owner!"); // Check if the caller is the owner of the campaign

        // Check the number of approvals and disapprovals for decision-making
        if (campaignRevisionApprovals[_id].length > campaignRevisionDisapprovals[_id].length) 
        {
            // More approvals than disapprovals, update the campaign status to "ACTIVE"
            campaigns[_id].status = CampaignStatus.ACTIVE;
            campaigns[_id].revisionTime = 0; // Reset revision time
        } 
        else 
        {
            campaigns[_id].status = CampaignStatus.BANNED; // More disapprovals than approvals, mark the campaign as "BANNED"

            // Perform associated actions (slash SSJ users, reward reporters, reward SSJ users, refund donators)
            slashSSJUsers(_id);
            rewardReporters(_id);
            rewardSSJUsers(_id);
            refundDonators(_id);

            // Clear approval and disapproval lists for revisioned campaigns
            delete campaignRevisionApprovals[_id];
            delete campaignRevisionDisapprovals[_id];
        }
    }



    /**
     * @dev Allows SuperSaiyan Set members to vote (approve or disapprove) for a pending campaign.
     * @param _id The unique identifier of the campaign to vote for.
     * @param _approval A boolean indicating whether the voter approves (true) or disapproves (false) of the campaign.
     * @return The remaining SSJ (SuperSaiyan) vault balance of the voter after the vote.
     * @dev The function checks various conditions, such as SSJ membership, campaign status, elapsed time, and previous votes, before recording the vote.
     * @dev The function updates the approval or disapproval lists for the specified campaign based on the voter's choice.
     */
    function voteForCampaign(uint256 _id, bool _approval) isVerified() isSSJ() hasNotVoted(_id) public returns (uint256) 
    {
        require(campaigns[_id].status == CampaignStatus.PENDING, "The specified campaign is not pending!"); // Check if the specified campaign is in "PENDING" status
        require(block.timestamp < campaigns[_id].creationTime + 7 days, "The campaign is too old, you cannot vote anymore!"); // Check if the current timestamp is within 7 days of the campaign creation

        // Record the approval or disapproval vote based on the voter's choice
        if (_approval) 
        { campaignApprovals[_id].push(msg.sender); } 
        else 
        { campaignDisapprovals[_id].push(msg.sender); }
        
        return ssjVaults[msg.sender]; // Return the remaining SSJ (SuperSaiyan) vault balance of the voter after the vote
    }
    


    /**
     * @dev Allows SuperSaiyan Set members to vote (approve or disapprove) for the revision of a campaign.
     * @param _id The unique identifier of the campaign to vote for revision.
     * @param _approval A boolean indicating whether the voter approves (true) or disapproves (false) of the revision.
     * @dev The function checks various conditions, such as SSJ membership, campaign status, elapsed time, previous votes, and voting history, before recording the vote.
     * @dev The function updates the approval or disapproval lists for the revision of the specified campaign based on the voter's choice.
     */
    function revisionCampaign(uint256 _id, bool _approval) isVerified() isSSJ() hasNotVoted(_id) public 
    {
        require(campaigns[_id].status == CampaignStatus.REVISION, "The specified campaign is not in revision!"); // Check if the specified campaign is in "REVISION" status
        require(block.timestamp < campaigns[_id].revisionTime + 7 days, "The revision is too old, you cannot vote anymore!"); // Check if the current timestamp is within 7 days of the campaign revision

        // Check if the voter has not already voted for the revision of the specified campaign
        require(!addressInArray(msg.sender, campaignRevisionApprovals[_id]), "You have already approved this campaign revision");
        require(!addressInArray(msg.sender, campaignRevisionDisapprovals[_id]), "You have already disapproved this campaign revision");

        // Record the approval or disapproval vote for the revision
        if (_approval) 
        { campaignRevisionApprovals[_id].push(msg.sender); } 
        else 
        { campaignRevisionDisapprovals[_id].push(msg.sender); }
    }



    /**
     * @dev Allows users to become part of the SuperSaiyan Set by depositing ETH and meeting certain requirements.
     * @dev The function checks various conditions, such as current SSJ membership, DST balance, and the required deposit, before adding the caller to the SuperSaiyan Set.
     * @dev Upon successful execution, the function sets the caller's SSJ vault balance to the deposited ETH amount.
     */
    function becomeSSJ() isVerified() public payable 
    {
        require(ssjVaults[msg.sender] == 0, "You are already part of the SuperSaiyan Set!"); // Check if the caller is not already part of the SuperSaiyan Set
        require(dstBalances[msg.sender] >= 500, "You must hold at least 500 DST to become part of the SuperSaiyan Set!"); // Check if the caller holds at least 500 DST to become part of the SuperSaiyan Set
        require(msg.value >= 0.5 ether, "You have to deposit at least 0.5 ETH to become a SuperSaiyan!"); // Check if the caller has deposited at least 0.5 ETH to become a SuperSaiyan

        ssjVaults[msg.sender] = msg.value; // Set the caller's SSJ vault balance to the deposited ETH amount
    }



    /**
     * @dev Allows users to transition from the SuperSaiyan Set to become a normal user by withdrawing their deposited ETH.
     * @dev The function checks whether the caller is part of the SuperSaiyan Set, and if so, transfers the deposited ETH back to the caller and sets their SSJ vault balance to zero.
     */
    function becomeNormalUser() isVerified() isSSJ() public 
    {
        // Transfer the deposited ETH back to the caller
        address payable user = payable(msg.sender);
        user.transfer(ssjVaults[msg.sender]);

        ssjVaults[msg.sender] = 0; // Set the caller's SSJ vault balance to zero
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