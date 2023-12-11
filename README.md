# DragonBlock: Crowdfunding DApp on Ethereum Blockchain

## Project Overview

The primary objective of this project is to develop a decentralized application (DApp) on the Ethereum blockchain, facilitating a crowdfunding system. Users have the flexibility to either create their fundraising campaigns or contribute to existing ones. Key features include MetaMask integration for secure wallet interactions, the creation of DSTs (Dragon Sphere Tokens) to empower users, the ability to participate in crowdfunding activities, and the implementation of Truffle for streamlined smart contract development and testing.

## Tasks

### 1. MetaMask Integration
MetaMask integration is a critical component of our DApp, providing users with a seamless and secure way to interact with the Ethereum blockchain. MetaMask serves as the bridge between the DApp and users' Ethereum wallets, enabling them to manage funds, create campaigns, and make donations.

### 2. Create DSTs and Their Achieving/Spending Logic
DSTs (Dragon Sphere Tokens) play a crucial role in our crowdfunding DApp. Users earn DSTs proportionally to their donations on the platform. These tokens not only represent a user's contribution but also grant voting rights in the platform's governance, allowing users to report suspicious campaigns.

Users can belong to two different groups:

- Normal User: a user that can create/donate/report campaigns.
- SSJ-User: a user that holds enough DSTs to become part of the SSJ (Super Saiyan) set. A subset of nodes that can approve or deny a campaign.

When a user wants to report a campaign, they have to spend a DST. If the reported campaign is banned, then all the reporters will be rewarded with 1 DST (the one spent for the report) and a fraction of a new DST. One potential issue related to reports is as follows: A set of malicious nodes starts reporting a campaign, if the set is big enough, they could ban the campaign to achieve the reward in DSTs (hence, they are able to become SSJ-User!). To address this problem, the campaign is not directly banned but is put in a “revision state” in which only the SSJ-Users (those that have not voted for approving the campaign) can decide whether the campaign is malicious or not.

### 3. Create or Donate to a Campaign
Users have the flexibility to either initiate their fundraising campaigns or contribute to existing ones. This functionality is the core of the crowdfunding DApp, promoting community involvement and financial support for various projects. When a user creates a new campaign, they have to define:

- The maximum total amount of ETH that can be donated to them
- Time limit
- What they will do with the donated ETH
- Rewards for the donors and the time needed to deliver them (Optional)

When a user donates to a campaign, the money is transferred to the contract account. The donations are sent to the campaign owner once the campaign ends. This way, if the campaign is banned before the money is transferred to the owner, the donors can be refunded (fees excluded).

Once the pot has been filled or the time limit has been reached, and if some rewards have been specified during the campaign creation, the user has to deliver them within the specified time. After the delivery, the donations will be transferred to their account.

To reduce the probability of scams, the campaign owner has to deposit 5% of the requested ETH as assurance. This bail is used to reward the SSJ-Users that have approved the campaign. In detail, when a campaign ends, those SSJ-Users will receive a fraction of that bail based on the success of the campaign. The following example should clarify the mechanism:

1. Assume that a user A wants to create a campaign of 100 ETH worth. When the campaign is approved by the SSJ-Users B, C, and D, 5 ETH is withdrawn from A's wallet.

2. Suppose that the campaign achieves a total of 90 ETH. Therefore, the success of that campaign can be estimated as 90% (90 achieved ETH / 100 requested ETH). Hence, 90% of the 5 ETH deposited as assurance is split equally among B, C, and D who have approved the campaign. The last 10% of the 5 ETH is kept by the smart contract.

A possible problem arises from the fact that the SSJ-Users are not risking anything, hence they could approve all the campaigns without being punished for that misbehavior. To address this problem, when a user has enough DSTs to become part of the SSJ set, they have to put 0.1 ETH (approximately 200€) as stake into the platform. When they achieve rewards from the platform, those ETH gained are added to their "vault," but when they approve a campaign with less than a 5% success rate, they get penalized by withdrawing ETH from the vault. The SSJ-User can freely decide when they want to exit from the SSJ-User set by withdrawing the vault value.

To ensure that SSJ-Users are active on the platform and votes for pending campaigns, they have up to 7 days to express a vote for a pending campaign, otherwise their DSTs are slashed.

### 4. User Combat Level
Each user is assigned a combat level ranging from 1 to 9000, which determines the maximum amount of ETH they can request in each deployed campaign. Users can increase or decrease their level based on the number of DSTs. The more a user donates and provides accurate reports, the higher their level becomes, allowing them to request more in their campaigns.

### 5. Implement Truffle for Smart Contract Development and Testing
Truffle is a powerful development framework for Ethereum that simplifies the process of writing, testing, and deploying smart contracts. Implementing Truffle into our project will enhance the efficiency and reliability of smart contract development.

### 6. Security
Through the blockchain, we can guarantee that the transactions are safe. Moreover, to discourage malicious users, when someone wants to create a new account, they have to pay a small fee. In this way, if an account is banned by the platform (more than one campaign has been closed due to reports), the user has to pay again to create a brand-new account. Every MetaMask account can be linked with only one system account.

## Conclusion

This project aims to create a user-friendly and secure crowdfunding DApp on the Ethereum blockchain. Through MetaMask integration, DST creation, the ability to create or donate to campaigns, and the implementation of Truffle for smart contract development and testing, users will experience a seamless and transparent platform for supporting a wide array of projects.
