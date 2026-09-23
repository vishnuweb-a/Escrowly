// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";

contract FreelanceEscrowTest is Test {

    FreelanceEscrow escrow;

    address client = address(0x1);
    address freelancer = address(0x2);
    address attacker = address(0x3);

    function setUp() public {
        escrow = new FreelanceEscrow();

        vm.deal(client, 10 ether);
        vm.deal(freelancer, 10 ether);
        vm.deal(attacker, 10 ether);
    }

    function testCreateJob() public {

        uint256 budget = 1 ether;
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(client);

        escrow.createJob(
            budget,
            deadline
        );

        (
            uint256 id,
            address jobClient,
            address jobFreelancer,
            uint256 jobBudget,
            uint256 escrowAmount,
            uint256 jobDeadline,
            FreelanceEscrow.JobStatus status,
            uint256 createdAt,
            uint256 fundedAt,
            string memory submissionURI,
            uint256 completedAt
        ) = escrow.jobs(1);

        assertEq(id, 1);

        assertEq(
            jobClient,
            client
        );

        assertEq(
            jobFreelancer,
            address(0)
        );

        assertEq(
            jobBudget,
            budget
        );

        assertEq(
            escrowAmount,
            0
        );

        assertEq(
            jobDeadline,
            deadline
        );

        assertEq(
            uint256(status),
            uint256(FreelanceEscrow.JobStatus.OPEN)
        );

        assertEq(
            fundedAt,
            0
        );

        assertEq(
            bytes(submissionURI).length,
            0
        );

        assertEq(
            completedAt,
            0
        );

        assertGt(
            createdAt,
            0
        );
    }
    function testCreateJobFailsWithZeroBudget() public {
    uint256 deadline = block.timestamp + 7 days;

    vm.prank(client);

    vm.expectRevert("Budget must be greater than zero");

    escrow.createJob(
        0,
        deadline
    );
}


function testCreateJobFailsWithPastDeadline() public {
    uint256 budget = 1 ether;

    uint256 pastDeadline = block.timestamp - 1;

    vm.prank(client);

    vm.expectRevert("Deadline must be in future");

    escrow.createJob(
        budget,
        pastDeadline
    );
}


function testFreelancerCanApply() public {

    uint256 budget = 1 ether;
    uint256 deadline = block.timestamp + 7 days;

    vm.prank(client);

    escrow.createJob(
        budget,
        deadline
    );


    vm.prank(freelancer);

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal-1"
    );


    (
        address applicant,
        uint256 proposedPrice,
        uint256 estimatedDuration,
        string memory proposalURI,
        uint256 createdAt
    ) = escrow.applications(1, 0);


    assertEq(
        applicant,
        freelancer
    );

    assertEq(
        proposedPrice,
        0.8 ether
    );

    assertEq(
        estimatedDuration,
        5 days
    );

    assertEq(
        proposalURI,
        "ipfs://proposal-1"
    );

    assertGt(
        createdAt,
        0
    );

    assertTrue(
        escrow.hasApplied(
            1,
            freelancer
        )
    );
}


function testClientCannotApplyToOwnJob() public {

    vm.prank(client);

    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );


    vm.prank(client);

    vm.expectRevert(
        "Client cannot apply to own job"
    );

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );
}


function testFreelancerCannotApplyTwice() public {

    vm.prank(client);

    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );


    vm.prank(freelancer);

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal-1"
    );


    vm.prank(freelancer);

    vm.expectRevert(
        "Already applied to this job"
    );

    escrow.applyForJob(
        1,
        0.7 ether,
        4 days,
        "ipfs://proposal-2"
    );
}
function testClientCanSelectFreelancer() public {

    vm.prank(client);

    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );


    vm.prank(freelancer);

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );


    vm.prank(client);

    escrow.selectFreelancer(
        1,
        0
    );


    (
        ,
        ,
        address selectedFreelancer,
        uint256 budget,
        ,
        ,
        FreelanceEscrow.JobStatus status,
        ,
        ,
        ,
        
    ) = escrow.jobs(1);


    assertEq(
        selectedFreelancer,
        freelancer
    );

    assertEq(
        budget,
        0.8 ether
    );

    assertEq(
        uint256(status),
        uint256(
            FreelanceEscrow.JobStatus.FREELANCER_SELECTED
        )
    );
}
function testOnlyClientCanSelectFreelancer() public {

    vm.prank(client);

    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );


    vm.prank(freelancer);

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );


    vm.prank(attacker);

    vm.expectRevert(
        "Only client can select freelancer"
    );

    escrow.selectFreelancer(
        1,
        0
    );
}
function testClientCanFundEscrow() public {

    vm.prank(client);

    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );


    vm.prank(freelancer);

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );


    vm.prank(client);

    escrow.selectFreelancer(
        1,
        0
    );


    uint256 clientBalanceBefore =
        client.balance;


    vm.prank(client);

    escrow.fundEscrow{
        value: 0.8 ether
    }(1);


    (
        ,
        ,
        ,
        uint256 budget,
        uint256 escrowAmount,
        ,
        FreelanceEscrow.JobStatus status,
        ,
        uint256 fundedAt,
        ,
        
    ) = escrow.jobs(1);


    assertEq(
        budget,
        0.8 ether
    );

    assertEq(
        escrowAmount,
        0.8 ether
    );

    assertEq(
        address(escrow).balance,
        0.8 ether
    );

    assertEq(
        client.balance,
        clientBalanceBefore - 0.8 ether
    );

    assertEq(
        uint256(status),
        uint256(
            FreelanceEscrow.JobStatus.FUNDED
        )
    );

    assertGt(
        fundedAt,
        0
    );
}
function testFundingFailsWithWrongAmount() public {

    vm.prank(client);

    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );


    vm.prank(freelancer);

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );


    vm.prank(client);

    escrow.selectFreelancer(
        1,
        0
    );


    vm.prank(client);

    vm.expectRevert(
        "Send exact agreed amount"
    );

    escrow.fundEscrow{
        value: 0.5 ether
    }(1);
}
function testCompleteEscrowFlow() public {

    // -------------------------------------------------
    // 1. CLIENT CREATES JOB
    // -------------------------------------------------

    vm.prank(client);

    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );


    // -------------------------------------------------
    // 2. FREELANCER APPLIES
    // -------------------------------------------------

    vm.prank(freelancer);

    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );


    // -------------------------------------------------
    // 3. CLIENT SELECTS FREELANCER
    // -------------------------------------------------

    vm.prank(client);

    escrow.selectFreelancer(
        1,
        0
    );


    // -------------------------------------------------
    // 4. CLIENT FUNDS ESCROW
    // -------------------------------------------------

    vm.prank(client);

    escrow.fundEscrow{
        value: 0.8 ether
    }(1);


    FreelanceEscrow.Job memory jobAfterFunding =
        escrow.getJob(1);

    assertEq(
        uint256(jobAfterFunding.status),
        uint256(
            FreelanceEscrow.JobStatus.FUNDED
        )
    );

    assertEq(
        jobAfterFunding.escrowAmount,
        0.8 ether
    );

    assertEq(
        address(escrow).balance,
        0.8 ether
    );


    // -------------------------------------------------
    // 5. FREELANCER STARTS WORK
    // -------------------------------------------------

    vm.prank(freelancer);

    escrow.startWork(1);


    FreelanceEscrow.Job memory jobInProgress =
        escrow.getJob(1);

    assertEq(
        uint256(jobInProgress.status),
        uint256(
            FreelanceEscrow.JobStatus.IN_PROGRESS
        )
    );


    // -------------------------------------------------
    // 6. FREELANCER SUBMITS WORK
    // -------------------------------------------------

    vm.prank(freelancer);

    escrow.submitWork(
        1,
        "ipfs://final-work"
    );


    FreelanceEscrow.Job memory jobSubmitted =
        escrow.getJob(1);

    assertEq(
        uint256(jobSubmitted.status),
        uint256(
            FreelanceEscrow.JobStatus.SUBMITTED
        )
    );

    assertEq(
        jobSubmitted.submissionURI,
        "ipfs://final-work"
    );


    // -------------------------------------------------
    // 7. RECORD FREELANCER BALANCE
    // -------------------------------------------------

    uint256 freelancerBalanceBefore =
        freelancer.balance;


    // -------------------------------------------------
    // 8. CLIENT APPROVES WORK
    // -------------------------------------------------

    vm.prank(client);

    escrow.approveWork(1);


    // -------------------------------------------------
    // 9. VERIFY FINAL STATE
    // -------------------------------------------------

    FreelanceEscrow.Job memory completedJob =
        escrow.getJob(1);


    assertEq(
        uint256(completedJob.status),
        uint256(
            FreelanceEscrow.JobStatus.COMPLETED
        )
    );

    assertEq(
        completedJob.escrowAmount,
        0
    );

    assertGt(
        completedJob.completedAt,
        0
    );


    // -------------------------------------------------
    // 10. VERIFY ETH TRANSFER
    // -------------------------------------------------

    assertEq(
        address(escrow).balance,
        0
    );

    assertEq(
        freelancer.balance,
        freelancerBalanceBefore + 0.8 ether
    );
}
function testOnlyFreelancerCanStartWork() public {

    vm.prank(client);
    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );

    vm.prank(freelancer);
    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );

    vm.prank(client);
    escrow.selectFreelancer(1, 0);

    vm.prank(client);
    escrow.fundEscrow{
        value: 0.8 ether
    }(1);


    vm.prank(attacker);

    vm.expectRevert(
        "Only selected freelancer"
    );

    escrow.startWork(1);
}
function testOnlyFreelancerCanSubmitWork() public {

    vm.prank(client);
    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );

    vm.prank(freelancer);
    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );

    vm.prank(client);
    escrow.selectFreelancer(1, 0);

    vm.prank(client);
    escrow.fundEscrow{
        value: 0.8 ether
    }(1);

    vm.prank(freelancer);
    escrow.startWork(1);


    vm.prank(attacker);

    vm.expectRevert(
        "Only selected freelancer"
    );

    escrow.submitWork(
        1,
        "ipfs://fake-work"
    );
}
function testOnlyClientCanApproveWork() public {

    vm.prank(client);
    escrow.createJob(
        1 ether,
        block.timestamp + 7 days
    );

    vm.prank(freelancer);
    escrow.applyForJob(
        1,
        0.8 ether,
        5 days,
        "ipfs://proposal"
    );

    vm.prank(client);
    escrow.selectFreelancer(1, 0);

    vm.prank(client);
    escrow.fundEscrow{
        value: 0.8 ether
    }(1);

    vm.prank(freelancer);
    escrow.startWork(1);

    vm.prank(freelancer);
    escrow.submitWork(
        1,
        "ipfs://final-work"
    );


    vm.prank(attacker);

    vm.expectRevert(
        "Only client can approve work"
    );

    escrow.approveWork(1);
}

}