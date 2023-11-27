# Crowdfunding DApp on Ethereum Blockchain

## Project Overview

The primary objective of this project is to develop a decentralized application (DApp) on the Ethereum blockchain, facilitating a crowdfunding system. Users have the flexibility to either create their fundraising campaigns or contribute to existing ones. Key features include MetaMask integration for secure wallet interactions, the creation of DSTs (Dragon Sphere Tokens) to empower users, the ability to participate in crowdfunding activities, and the implementation of Truffle for streamlined smart contract development and testing.

## Tasks

### 1. MetaMask Integration
MetaMask integration is a critical component of our DApp, providing users with a seamless and secure way to interact with the Ethereum blockchain. MetaMask serves as the bridge between the DApp and users' Ethereum wallets, enabling them to manage funds, create campaigns, and make donations.

### 2. Create DSTs and Their Achieving/Spending Logic
DSTs (Dragon Sphere Tokens) play a crucial role in our crowdfunding DApp. Users earn DSTs proportionally to their donations on the platform. These tokens not only represent a user's contribution but also grant voting rights in the platform's governance, allowing users to report suspicious campaigns.
Users can belong to three diffent groups:

- Normal User: user that can create/donate/report campaigns.
- SSJ-User: user that holds enough DSTs to become part of the SSJ (Super Saiyan) set. A subset of nodes that can approve or deny a campaign. They will be rewarded with a small fee once that the campaign ends (if has not been reported and banned).

When a user wants to report a campaign, he has to spend a DST. If the reported campaign is banned, then all the reporters will be rewarded with 2 DSTs and a small fee.

### 3. Create or Donate to a Campaign
Users have the flexibility to either initiate their fundraising campaigns or contribute to existing ones. This functionality is the core of the crowdfunding DApp, promoting community involvement and financial support for various projects. When a user creates a new campaign, he has to define:

- The maximum total amount of ETH that can be donated to him
- Time limit
- What he will do with the donated ETH
- Rewards for the donors and the time needed to deliver them (Optional)

Once the pot has been filled or the time limit has been reached, and if some rewards have been specified during the campaign creation, he has to deliver them within the specified time. After the delivery, the donations will be transferred to his account.

To reduce the probability of scams, the campaign owner has to deposit 10% of the requested ETH as assurance. If the campaign is banned, this bail will be used to reward the users who have reported the campaign.

When a user donates to a campaign, the money is transferred to a provisional account. The donations are sent to the campaign owner once the campaign ends. This way, if the campaign is banned before the money is transferred to the owner, the donors can be refunded (fees excluded).

### 4. User Combat Level
Each user is assigned a combat level ranging from 1 to 9000, which determines the maximum amount of ETH they can request in each deployed campaign. Users can increase or decrease their level based on the number of DSTs. The more a user donates and provides accurate reports, the higher their level becomes, allowing them to request more in their campaigns.

### 5. Implement Truffle for Smart Contract Development and Testing
Truffle is a powerful development framework for Ethereum that simplifies the process of writing, testing, and deploying smart contracts. Implementing Truffle into our project will enhance the efficiency and reliability of smart contract development.

### 6. Security
Through the blockchain we can guarantee that the transactions are safe. Moreover, in order to discourage malicious users, when someone wants to create a new account, he has to pay a little fee. In this way, if an account is banned by the platform (more than one campaign has been closed due to reports), the user has to pay again to create a brand-new account. Every metamask account can be linked with only one system account.

## Conclusion

This project aims to create a user-friendly and secure crowdfunding DApp on the Ethereum blockchain. Through MetaMask integration, DST creation, the ability to create or donate to campaigns, and the implementation of Truffle for smart contract development and testing, users will experience a seamless and transparent platform for supporting a wide array of projects.
