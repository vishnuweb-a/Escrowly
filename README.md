Web3 Freelance Escrow

A decentralized freelance marketplace powered by Ethereum smart-contract escrow.

The application allows clients to create freelance jobs, freelancers to apply, clients to select a freelancer, and the agreed payment to be locked inside a smart contract. Once the freelancer submits the completed work and the client approves it, the contract automatically releases the escrowed ETH to the freelancer.

The current version is designed for the Ethereum Sepolia testnet so the complete workflow can be demonstrated without using real funds.

Overview

Traditional freelance platforms require both clients and freelancers to trust a centralized platform for payments.

This project explores a more transparent workflow:

the client creates a job,

freelancers apply,

the client selects one freelancer,

the client deposits the agreed amount into a smart contract,

the smart contract holds the funds,

the freelancer completes and submits the work,

the client reviews the submission,

approval automatically releases the payment.

The blockchain is used primarily for escrow, payment state, authorization, and transaction verification.

It is not used to store large project files or determine whether submitted work is objectively good.

Core Workflow

Client Creates Job
        ↓
Job Status: OPEN
        ↓
Freelancers Apply
        ↓
Client Selects Freelancer
        ↓
Status: FREELANCER_SELECTED
        ↓
Client Funds Escrow
        ↓
ETH Locked in Smart Contract
        ↓
Status: FUNDED
        ↓
Freelancer Starts Work
        ↓
Status: IN_PROGRESS
        ↓
Freelancer Submits Work
        ↓
Status: SUBMITTED
        ↓
Client Reviews Work
        ↓
Client Approves
        ↓
Smart Contract Releases ETH
        ↓
Status: COMPLETED

The core product loop is:

Create → Apply → Select → Fund → Work → Submit → Approve → Pay

Why Blockchain?

The smart contract acts as a neutral escrow layer between the client and the freelancer.

Instead of:

Client
   ↓
Pays freelancer directly
   ↓
Must trust freelancer

the application uses:

Client
   ↓
Deposits ETH
   ↓
Smart Contract
   ↓
ETH Locked
   ↓
Work Submitted
   ↓
Client Approves
   ↓
ETH Released
   ↓
Freelancer

This provides:

transparent escrow state,

programmable payment release,

wallet-based authorization,

publicly verifiable transactions,

protection against accidental double payment,

reduced dependency on a centralized payment processor.

Current Smart Contract Features

Job Creation

Clients can create jobs with:

budget,

deadline,

creator wallet address,

creation timestamp.

New jobs automatically begin with:

OPEN

Freelancer Applications

Freelancers can apply with:

proposed price,

estimated duration,

proposal URI/reference,

applicant wallet address,

application timestamp.

The contract prevents:

clients from applying to their own jobs,

duplicate applications from the same wallet,

applications to jobs that are no longer open.

Freelancer Selection

Only the client who created the job can select a freelancer.

When a freelancer is selected:

OPEN
   ↓
FREELANCER_SELECTED

The selected freelancer's proposed price becomes the agreed project budget.

Escrow Funding

After selecting a freelancer, the client can call:

fundEscrow(jobId)

and send the exact agreed amount.

The ETH remains inside the smart contract.

Example:

Client Wallet
    │
    │ 0.05 ETH
    ▼
FreelanceEscrow Contract
    │
    │ 🔒 Locked
    ▼
Selected Freelancer

The freelancer does not receive the funds at this stage.

Start Work

Only the selected freelancer can start the project.

FUNDED
   ↓
IN_PROGRESS

This prevents work from starting through the contract before escrow has been funded.

Work Submission

Only the selected freelancer can submit work.

The freelancer provides a submission reference such as:

https://github.com/user/project

or:

ipfs://Qm...

The contract stores the submission URI/reference and updates the state:

IN_PROGRESS
   ↓
SUBMITTED

Large project files are not stored directly on Ethereum.

Client Approval

Only the job client can approve submitted work.

The contract verifies that the job is currently:

SUBMITTED

before payment can be released.

Automatic Payment Release

When the client approves the work:

the escrow amount is read,

escrow storage is set to zero,

the job becomes COMPLETED,

the completion timestamp is stored,

ETH is sent to the freelancer.

SUBMITTED
   ↓
approveWork()
   ↓
COMPLETED
   ↓
ETH → Freelancer

The payment flow uses reentrancy protection and follows the checks-effects-interactions pattern.

Job States

The current contract uses:

enum JobStatus {
    OPEN,
    FREELANCER_SELECTED,
    FUNDED,
    IN_PROGRESS,
    SUBMITTED,
    COMPLETED,
    CANCELLED
}

State flow:

OPEN
 │
 ▼
FREELANCER_SELECTED
 │
 ▼
FUNDED
 │
 ▼
IN_PROGRESS
 │
 ▼
SUBMITTED
 │
 ▼
COMPLETED

A job can also be cancelled before escrow funding.

Smart Contract Data Model

Job

struct Job {
    uint256 id;
    address client;
    address freelancer;
    uint256 budget;
    uint256 escrowAmount;
    uint256 deadline;
    JobStatus status;
    uint256 createdAt;
    uint256 fundedAt;
    string submissionURI;
    uint256 completedAt;
}

Application

struct Application {
    address applicant;
    uint256 proposedPrice;
    uint256 estimatedDuration;
    string proposalURI;
    uint256 createdAt;
}

Main Contract Functions

Job Management

createJob()

Creates a new freelance job.

cancelJob()

Allows the client to cancel a job before escrow funding.

Freelancer Applications

applyForJob()

Allows a freelancer to submit an application.

selectFreelancer()

Allows the client to select one applicant.

Escrow

fundEscrow()

Allows the client to lock the exact agreed ETH amount inside the smart contract.

Work Management

startWork()

Moves the funded project into active work.

submitWork()

Stores the freelancer's submission reference.

approveWork()

Approves the submission and releases escrowed ETH to the freelancer.

Read Functions

getJob()

Returns complete job information.

getApplication()

Returns a specific application.

getApplicationsCount()

Returns the number of applications for a job.

Smart Contract Events

The contract emits events for important blockchain actions.

JobCreated
FreelancerApplied
FreelancerSelected
EscrowFunded
WorkStarted
WorkSubmitted
PaymentReleased
JobCancelled

These events can later be consumed by the frontend to display transaction history and project activity.

Security Rules

The contract currently enforces several important rules.

Only the client can select a freelancer

msg.sender == job.client

Only the client can fund escrow

msg.sender == job.client

Only the selected freelancer can start work

msg.sender == job.freelancer

Only the selected freelancer can submit work

msg.sender == job.freelancer

Only the client can approve submitted work

msg.sender == job.client

Exact escrow amount required

The client must send exactly the selected freelancer's agreed price.

Duplicate applications are prevented

Each wallet can apply only once to a particular job.

Payment can only occur from the correct state

Approval is only allowed when the job is:

SUBMITTED

Reentrancy protection

The payment release function uses a reentrancy guard.

Checks-Effects-Interactions

Contract state is updated before ETH is transferred.

Technology Stack

Smart Contract

Solidity

Foundry

Forge

Open Ethereum-compatible tooling

Blockchain

Ethereum

Sepolia Testnet

Wallet / Web3

Planned frontend integration:

MetaMask

wagmi

viem

Frontend

Planned stack:

React / Next.js

TypeScript

Tailwind CSS

shadcn/ui

Off-Chain Storage

Recommended:

Supabase

IPFS

GitHub

Supabase Storage

On-Chain vs Off-Chain Data

Not everything should be stored on Ethereum.

On-Chain

Store data that benefits from blockchain verification:

wallet addresses,

job ID,

freelancer selection,

agreed budget,

escrow amount,

job status,

submission reference,

timestamps,

payment transactions.

Off-Chain

Store larger or frequently changing data:

user profiles,

full job descriptions,

proposal text,

portfolio data,

chat messages,

project files,

images,

notifications,

reviews.

Suggested architecture:

                    FRONTEND
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
         SUPABASE          SMART CONTRACT
             │                   │
             ▼                   ▼
      App / User Data         SEPOLIA
                                 │
                                 ▼
                           Escrow / ETH

Project Structure

freelance-escrow/
│
├── src/
│   └── FreelanceEscrow.sol
│
├── test/
│   └── FreelanceEscrow.t.sol
│
├── script/
│   └── DeployFreelanceEscrow.s.sol
│
├── lib/
│   └── forge-std/
│
├── foundry.toml
├── .gitignore
└── README.md

Development Setup

Requirements

Install:

Git

Foundry

MetaMask

access to an Ethereum Sepolia RPC endpoint.

Verify Foundry:

forge --version

Clone the Repository

git clone <repository-url>
cd freelance-escrow

Install dependencies:

forge install

Build:

forge build

Run Tests

Run the complete test suite:

forge test -vv

For detailed traces:

forge test -vvv

Current tests cover:

valid job creation,

zero-budget rejection,

invalid deadline rejection,

freelancer applications,

client self-application rejection,

duplicate application rejection,

freelancer selection,

unauthorized selection rejection,

escrow funding,

incorrect funding amount rejection,

ETH lock verification,

work start authorization,

work submission authorization,

client-only approval,

complete escrow lifecycle,

final freelancer payment.

Local Development

Start a local Ethereum node:

anvil

The contract can then be deployed and tested locally using Foundry.

Sepolia Deployment

The project is currently designed for Ethereum Sepolia.

Set your RPC endpoint in your environment.

Example PowerShell:

$env:SEPOLIA_RPC_URL="YOUR_SEPOLIA_RPC_URL"

Verify the chain:

cast chain-id --rpc-url $env:SEPOLIA_RPC_URL

Expected:

11155111

Run a deployment simulation:

forge script script/DeployFreelanceEscrow.s.sol:DeployFreelanceEscrow --rpc-url $env:SEPOLIA_RPC_URL --interactive -vvvv

Deploy:

forge script script/DeployFreelanceEscrow.s.sol:DeployFreelanceEscrow --rpc-url $env:SEPOLIA_RPC_URL --interactive --broadcast -vvvv

Never commit private keys to GitHub.

Verify Deployment

Check deployed bytecode:

cast code YOUR_CONTRACT_ADDRESS --rpc-url YOUR_RPC_URL

Read the initial job counter:

cast call YOUR_CONTRACT_ADDRESS "jobCounter()(uint256)" --rpc-url YOUR_RPC_URL

A newly deployed contract should initially return:

0

Frontend Integration

The frontend will use:

Contract Address
       +
Contract ABI
       +
Sepolia Network
       ↓
wagmi / viem
       ↓
React / Next.js

Example write interaction:

writeContract({
  address: FREELANCE_ESCROW_ADDRESS,
  abi: freelanceEscrowAbi,
  functionName: "createJob",
  args: [budget, deadline],
});

Escrow funding will additionally send ETH:

writeContract({
  address: FREELANCE_ESCROW_ADDRESS,
  abi: freelanceEscrowAbi,
  functionName: "fundEscrow",
  args: [jobId],
  value: agreedAmount,
});

The frontend should always use the smart contract as the source of truth for:

current job status,

selected freelancer,

escrow amount,

allowed next action,

payment completion.

Planned Frontend Screens

The MVP frontend will include:

Landing Page
Explore Jobs
Job Details
Create Job
Apply for Job
Applications
Client Dashboard
Freelancer Dashboard
Active Project
Escrow Funding
Work Submission
Client Review
Completed Project
Transactions
Wallet Connection
Wrong Network State

Current Limitations

No automatic quality validation

The blockchain can verify:

Escrow exists
Work was submitted
Client approved
Payment was released

It cannot determine:

"The submitted project is high quality."

Human client review is still required.

No revision workflow yet

The current smart contract does not yet include:

requestRevision()

or resubmission states.

No dispute system yet

If the client and freelancer disagree, there is currently no arbitrator or decentralized dispute resolution mechanism.

ETH price volatility

Jobs are currently priced in ETH.

Future versions may support stablecoins.

Public blockchain privacy

Ethereum transactions and wallet activity are public.

Sensitive data should remain off-chain.

Roadmap

MVP

Job creation

Freelancer applications

Duplicate application prevention

Freelancer selection

ETH escrow

Start work

Work submission

Client approval

Automatic payment release

Job cancellation before funding

Foundry tests

Sepolia deployment workflow

Frontend UI

MetaMask integration

Contract frontend integration

Transaction explorer links

Version 2

Revision requests

Resubmission

Dispute system

Arbitrator

Reputation

Ratings

Search and filtering

Notifications

IPFS integration

Version 3

Milestone payments

Stablecoin payments

DAO-based dispute resolution

On-chain credentials

Multi-chain support

Decentralized identity

Product Vision

The long-term objective is to build a Web3-native freelance marketplace where the most important payment rules are enforced transparently by smart contracts.

                 WEB3 FREELANCE
                       │
           ┌───────────┼───────────┐
           │           │           │
           ▼           ▼           ▼
         JOBS       ESCROW     REPUTATION
           │           │           │
           └───────────┼───────────┘
                       │
                       ▼
                SMART CONTRACT
                       │
                       ▼
                    ETHEREUM

The first milestone remains intentionally simple:

Create → Apply → Select → Fund → Work → Submit → Approve → Pay

Once this loop works reliably through the frontend on Sepolia, more advanced freelance features can be added without changing the fundamental escrow architecture.

Disclaimer

This project is currently an educational and development-stage decentralized application running on the Ethereum Sepolia testnet.

It has not been independently audited and should not be used to custody real funds in production without professional smart-contract security review and additional testing.

License

MIT