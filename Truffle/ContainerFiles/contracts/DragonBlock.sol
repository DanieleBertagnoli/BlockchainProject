// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DragonBlock Smart Contract
 * @dev A decentralized crowdfunding platform where users can create campaigns, donate, and vote using SuperSaiyan (SSJ) tokens.
 */
contract DragonBlock {

    // Enum to represent different statuses of a campaign
    enum CampaignStatus {
        PENDING,
        ACTIVE,
        DISAPPROVED,
        REVISION,
        BANNED,
        ENDED
    }

    // Struct to represent a campaign
    struct Campaign {
        address owner;          // Address of the campaign owner
        uint256 id;             // Unique identifier for the campaign
        CampaignStatus status;  // Current status of the campaign
        uint256 weiLimit;       // Maximum amount of ETH that can be donated to the campaign
        uint256 donatedWei;     // Total ETH donated to the campaign
        uint256 creationTime;   // Timestamp when the campaign was created
        uint256 revisionTime;   // Timestamp when the campaign entered the revision state
        uint16 weekDuration;    // Duration of the campaign in weeks
    }

    event CampaignCreation(uint256 campaignId);

    // Array to store all campaigns
    Campaign[] public campaigns;

    // Mapping to track DST balances of users
    mapping(address => uint) public dstBalances;

    // Mapping to track users who are part of the SuperSaiyan Set
    mapping(address => uint256) public ssjVaults;

    // Mapping to store addresses that approved or disapproved a campaign
    mapping(uint256 => address[]) private campaignApprovals;
    mapping(uint256 => address[]) private campaignDisapprovals;

    // Mapping to store addresses that approved or disapproved a revisioned campaign
    mapping(uint256 => address[]) private campaignRevisionApprovals;
    mapping(uint256 => address[]) private campaignRevisionDisapprovals;

    // Mapping to store addresses that reported a campaign
    mapping(uint256 => address[]) private campaignReports;

    struct Donation {
        address donator;
        uint256 donatedWei;
    }
    mapping (uint256 => Donation[]) private donators;

    // Address of the contract creator
    address public minter;

    /**
     * @dev Constructor to initialize the contract
     */
    constructor() {
        minter = msg.sender; // Initialize DST balance for a default address
        dstBalances[0x715428e23981A4DC06a20559AC17D81C20b9bB02] = 200;
    }

    /**
     * @dev Private function to check if an address is in an array
     * @param _address The address to check
     * @param _listOfAddresses The array of addresses to search
     * @return Whether the address is in the array or not
     */
    function addressInArray(address _address, address[] storage _listOfAddresses) private view returns(bool) {
        for (uint i = 0; i < _listOfAddresses.length; i++) {
            if (_listOfAddresses[i] == _address) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Private function to slash SSJ users' funds
     * @param _campaignID The ID of the campaign
     */
    function slashSSJUsers(uint256 _campaignID) private {
        for (uint i = 0; i < campaignApprovals[_campaignID].length; i++) {
            address slashedUser = campaignApprovals[_campaignID][i];
            ssjVaults[slashedUser] -= 250000;
            if (ssjVaults[slashedUser] < 0.05 ether) {
                // If the SSJ User has less than 10% of the starting needed ETH
                address payable user = payable(slashedUser);
                user.transfer(ssjVaults[slashedUser]);
                ssjVaults[slashedUser] = 0;
            }
        }
    }

    /**
     * @dev Private function to reward SSJ users based on campaign donation percentage
     * @param _campaignID The ID of the campaign
     */
    function rewardSSJUsers(uint256 _campaignID) private {
        uint percentage = campaigns[_campaignID].donatedWei * 100 / campaigns[_campaignID].weiLimit;
        if (percentage <= 5) {
            return;
        }

        for (uint i = 0; i < campaignApprovals[_campaignID].length; i++) {
            address rewardedUser = campaignApprovals[_campaignID][i];
            ssjVaults[rewardedUser] += (100 - percentage) / campaignApprovals[_campaignID].length;
        }
    }

    /**
     * @dev Private function to reward users who reported a campaign
     * @param _campaignID The ID of the campaign
     */
    function rewardReporters(uint256 _campaignID) private {
        for (uint i = 0; i < campaignReports[_campaignID].length; i++) {
            address rewardedUser = campaignReports[_campaignID][i];
            dstBalances[rewardedUser] += 2;
        }
    }

    function refundDonators(uint256 _campaignID) private {
        for (uint i = 0; i < donators[_campaignID].length; i++) {
            address payable user = payable(donators[_campaignID][i].donator);
            user.transfer(donators[_campaignID][i].donatedWei);
        }
    }

    /**
     * @dev Public function to create a new campaign
     * @param _weiLimit Maximum amount of ETH that can be donated to the campaign
     * @param _weekDuration Duration of the campaign in weeks
     */
    function createCampaign(uint256 _weiLimit, uint16 _weekDuration) public payable {
        require(msg.value == _weiLimit * 5 / 100, "You have to deposit 5% of the weiLimit!");
        require(_weiLimit > 0.05 ether, "The donation limit must be greater than 0.05 ETH");
        require(_weiLimit % 0.005 ether == 0, "The donation limit must be a multiple of 0.005 ETH");
        require(_weekDuration > 0, "The campaign duration (expressed in weeks) must be greater than 0");

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

        emit CampaignCreation(campaigns.length-1);
    }

    // Function to get a window of 20 elements starting from the last one
    function getCampaigns(uint256 _campaignWindow) public view returns (Campaign[] memory) {
        require(_campaignWindow > 0, "Window size must be greater than 0");
        require(int256(campaigns.length) - int256(_campaignWindow-1) * 20 >= 0, "The window size is too large");

        // Calculate the starting index for the window
        int256 startIndex = int256(campaigns.length) - int256(_campaignWindow) * 20;
        if (startIndex < 0) {
            startIndex = 0;
        }

        // Calculate the actual number of elements to include in the result
        uint256 numElements = uint256(startIndex + 20) <= campaigns.length ? 20 : campaigns.length - uint256(startIndex);

        // Create a memory array to store the window of elements
        Campaign[] memory result = new Campaign[](numElements);

        // Use a loop to copy the elements to the result array
        for (uint256 i = 0; i < numElements; i++) {
            result[i] = campaigns[uint256(startIndex + int256(i))];
        }

        return result;
    }


    /**
     * @dev Public function to donate to an active campaign
     * @param _id The ID of the campaign
     */
    function donateCampaign(uint256 _id) public payable {
        require(_id < campaigns.length, "The specified campaign does not exist");
        require(campaigns[_id].status == CampaignStatus.ACTIVE, "The specified campaign is not active");
        require(campaigns[_id].weiLimit - campaigns[_id].donatedWei - msg.value >= 0, "The limit for this campaign has been reached");
        require(msg.value > 0, "The donation must be greater than zero");
        require(msg.value % 0.0005 ether == 0, "You can donate only using steps of 0.0005 ETH");

        campaigns[_id].donatedWei += msg.value; // Update the campaign's donatedWei field
        dstBalances[msg.sender] += msg.value / 0.0005 ether;
        donators[_id].push(Donation({
            donator: msg.sender,
            donatedWei: msg.value
            })
        );

        if (campaigns[_id].status == CampaignStatus.ACTIVE && (block.timestamp >= campaigns[_id].creationTime + campaigns[_id].weekDuration * 1 weeks || campaigns[_id].donatedWei == campaigns[_id].weiLimit)) {
                campaigns[_id].status = CampaignStatus.ENDED;
                rewardSSJUsers(_id);

                address payable campaignOwner = payable(campaigns[_id].owner);
                campaignOwner.transfer(campaigns[_id].donatedWei);
            }
    }

    /**
     * @dev Public function to report a campaign
     * @param _id The ID of the campaign
     */
    function reportCampaign(uint256 _id) public {
        require(_id < campaigns.length, "The specified campaign does not exist");
        require(campaigns[_id].status == CampaignStatus.ACTIVE, "The specified campaign is not active");
        require(dstBalances[msg.sender] > 0, "You must have at least 1 DST");

        dstBalances[msg.sender] -= 1;
        campaignReports[_id].push(msg.sender);

        if (campaignReports[_id].length > 1) {
            // More than 100 reports, then the campaign is put in revision state
            campaigns[_id].status = CampaignStatus.REVISION;
            campaigns[_id].revisionTime = block.timestamp;
        }
    }

    /**
     * @dev Public function for SSJ users to vote (approve or disapprove) a pending campaign
     * @param _id The ID of the campaign
     * @param _approval Whether the user approves or disapproves the campaign
     */
    function voteForCampaign(uint256 _id, bool _approval) public returns(uint256) {
        //require(ssjVaults[msg.sender] > 0, "You are not part of the SuperSaiyan Set!");
        require(campaigns[_id].status == CampaignStatus.PENDING, "The specified campaign is not pending!");
        require(!addressInArray(msg.sender, campaignApprovals[_id]), "You have already approved this campaign");
        require(!addressInArray(msg.sender, campaignDisapprovals[_id]), "You have already disapproved this campaign");

        // Record the approval or disapproval vote
        if (_approval) {
            campaignApprovals[_id].push(msg.sender);
        } else {
            campaignDisapprovals[_id].push(msg.sender);
        }

        if (campaigns[_id].status == CampaignStatus.PENDING && block.timestamp >= campaigns[_id].creationTime + 0 days) {
            // Check if the voting period has ended
            if (campaignApprovals[_id].length > campaignDisapprovals[_id].length) {
                campaigns[_id].status = CampaignStatus.ACTIVE;
            } else {
                campaigns[_id].status = CampaignStatus.DISAPPROVED;
            }
        }

        return ssjVaults[msg.sender];
    }

    /**
     * @dev Public function for SSJ users to vote (approve or disapprove) a revisioned campaign
     * @param _id The ID of the campaign
     * @param _approval Whether the user approves or disapproves the campaign
     */
    function revisionCampaign(uint256 _id, bool _approval) public {
        require(ssjVaults[msg.sender] > 0, "You are not part of the SuperSaiyan Set!");
        require(campaigns[_id].status == CampaignStatus.REVISION, "The specified campaign is not in revision!");
        require(!addressInArray(msg.sender, campaignRevisionApprovals[_id]), "You have already approved this campaign");
        require(!addressInArray(msg.sender, campaignRevisionDisapprovals[_id]), "You have already disapproved this campaign");

        // Record the approval or disapproval vote
        if (_approval) {
            campaignRevisionApprovals[_id].push(msg.sender);
        } else {
            campaignRevisionDisapprovals[_id].push(msg.sender);
        }

        if (campaigns[_id].status == CampaignStatus.REVISION && block.timestamp >= campaigns[_id].revisionTime + 0 days) {
            // Check if the voting period has ended
            if (campaignRevisionApprovals[_id].length > campaignRevisionDisapprovals[_id].length) {
                campaigns[_id].status = CampaignStatus.ACTIVE;
                campaigns[_id].revisionTime = 0;
                delete campaignRevisionApprovals[_id];
                delete campaignRevisionDisapprovals[_id];
            } else {
                campaigns[_id].status = CampaignStatus.BANNED;
                slashSSJUsers(_id);
                rewardReporters(_id);
                refundDonators(_id);
            }
        }
    }

    /**
     * @dev Public function for users to become part of the SuperSaiyan Set
     */
    function becomeSSJ() public payable {
        require(ssjVaults[msg.sender] == 0, "You are already part of the SuperSaiyan Set!");
        require(dstBalances[msg.sender] >= 100, "You must hold at least 100 DST to become part of the SuperSaiyan Set!");
        require(msg.value >= 0.5 ether, "You have to deposit at least 0.5 ETH to become a SuperSaiyan!");

        ssjVaults[msg.sender] = msg.value;
    }

    /**
     * @dev Public function for users to exit the SuperSaiyan Set and become a normal user
     */
    function becomeNormalUser() public {
        require(ssjVaults[msg.sender] > 0, "You are not part of the SuperSaiyan Set!");

        address payable user = payable(msg.sender);
        user.transfer(ssjVaults[msg.sender]);
        ssjVaults[msg.sender] = 0;
    }

    /**
     * @dev Public function for the contract creator to terminate the contract and withdraw funds
     */
    function terminate() public {
        require(msg.sender == minter, "You cannot terminate the contract!");
        payable(minter).transfer(address(this).balance);
    }
}
