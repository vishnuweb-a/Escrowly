// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FreelanceEscrow {
    // =============================================================
    //                          ENUM
    // =============================================================

    enum JobStatus {
        OPEN,
        FREELANCER_SELECTED,
        FUNDED,
        IN_PROGRESS,
        SUBMITTED,
        COMPLETED,
        CANCELLED
    }

    // =============================================================
    //                         STRUCTS
    // =============================================================

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

    struct Application {
        address applicant;

        uint256 proposedPrice;
        uint256 estimatedDuration;

        string proposalURI;

        uint256 createdAt;
    }

    // =============================================================
    //                         STORAGE
    // =============================================================

    uint256 public jobCounter;

    mapping(uint256 => Job) public jobs;

    mapping(uint256 => Application[]) public applications;

    mapping(uint256 => mapping(address => bool)) public hasApplied;

    // =============================================================
    //                    REENTRANCY PROTECTION
    // =============================================================

    uint256 private locked = 1;

    modifier nonReentrant() {
        require(locked == 1, "Reentrant call");

        locked = 2;

        _;

        locked = 1;
    }

    // =============================================================
    //                          EVENTS
    // =============================================================

    event JobCreated(uint256 indexed jobId, address indexed client, uint256 budget, uint256 deadline);

    event FreelancerApplied(uint256 indexed jobId, address indexed freelancer, uint256 proposedPrice);

    event FreelancerSelected(uint256 indexed jobId, address indexed freelancer, uint256 agreedPrice);

    event EscrowFunded(uint256 indexed jobId, address indexed client, uint256 amount);

    event WorkStarted(uint256 indexed jobId, address indexed freelancer);

    event WorkSubmitted(uint256 indexed jobId, address indexed freelancer, string submissionURI);

    event PaymentReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);

    event JobCancelled(uint256 indexed jobId, address indexed client);

    // =============================================================
    //                       CREATE JOB
    // =============================================================

    function createJob(uint256 _budget, uint256 _deadline) external {
        require(_budget > 0, "Budget must be greater than zero");

        require(_deadline > block.timestamp, "Deadline must be in future");

        jobCounter++;

        jobs[jobCounter] = Job({
            id: jobCounter,
            client: msg.sender,
            freelancer: address(0),
            budget: _budget,
            escrowAmount: 0,
            deadline: _deadline,
            status: JobStatus.OPEN,
            createdAt: block.timestamp,
            fundedAt: 0,
            submissionURI: "",
            completedAt: 0
        });

        emit JobCreated(jobCounter, msg.sender, _budget, _deadline);
    }

    // =============================================================
    //                    APPLY FOR JOB
    // =============================================================

    function applyForJob(
        uint256 _jobId,
        uint256 _proposedPrice,
        uint256 _estimatedDuration,
        string calldata _proposalURI
    ) external {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        Job storage job = jobs[_jobId];

        require(job.status == JobStatus.OPEN, "Job is not open");

        require(msg.sender != job.client, "Client cannot apply to own job");

        require(!hasApplied[_jobId][msg.sender], "Already applied to this job");

        require(_proposedPrice > 0, "Proposed price must be greater than zero");

        require(_estimatedDuration > 0, "Duration must be greater than zero");

        require(bytes(_proposalURI).length > 0, "Proposal URI required");

        applications[_jobId].push(
            Application({
                applicant: msg.sender,
                proposedPrice: _proposedPrice,
                estimatedDuration: _estimatedDuration,
                proposalURI: _proposalURI,
                createdAt: block.timestamp
            })
        );

        hasApplied[_jobId][msg.sender] = true;

        emit FreelancerApplied(_jobId, msg.sender, _proposedPrice);
    }

    // =============================================================
    //                    SELECT FREELANCER
    // =============================================================

    function selectFreelancer(uint256 _jobId, uint256 _applicationIndex) external {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        Job storage job = jobs[_jobId];

        require(msg.sender == job.client, "Only client can select freelancer");

        require(job.status == JobStatus.OPEN, "Job is not open");

        require(_applicationIndex < applications[_jobId].length, "Application does not exist");

        Application storage selectedApplication = applications[_jobId][_applicationIndex];

        job.freelancer = selectedApplication.applicant;

        job.budget = selectedApplication.proposedPrice;

        job.status = JobStatus.FREELANCER_SELECTED;

        emit FreelancerSelected(_jobId, selectedApplication.applicant, selectedApplication.proposedPrice);
    }

    // =============================================================
    //                       FUND ESCROW
    // =============================================================

    function fundEscrow(uint256 _jobId) external payable {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        Job storage job = jobs[_jobId];

        require(msg.sender == job.client, "Only client can fund escrow");

        require(job.status == JobStatus.FREELANCER_SELECTED, "Freelancer not selected");

        require(msg.value == job.budget, "Send exact agreed amount");

        job.escrowAmount = msg.value;

        job.fundedAt = block.timestamp;

        job.status = JobStatus.FUNDED;

        emit EscrowFunded(_jobId, msg.sender, msg.value);
    }

    // =============================================================
    //                       START WORK
    // =============================================================

    function startWork(uint256 _jobId) external {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        Job storage job = jobs[_jobId];

        require(msg.sender == job.freelancer, "Only selected freelancer");

        require(job.status == JobStatus.FUNDED, "Escrow not funded");

        job.status = JobStatus.IN_PROGRESS;

        emit WorkStarted(_jobId, msg.sender);
    }

    // =============================================================
    //                       SUBMIT WORK
    // =============================================================

    function submitWork(uint256 _jobId, string calldata _submissionURI) external {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        Job storage job = jobs[_jobId];

        require(msg.sender == job.freelancer, "Only selected freelancer");

        require(job.status == JobStatus.IN_PROGRESS, "Work is not in progress");

        require(bytes(_submissionURI).length > 0, "Submission URI required");

        job.submissionURI = _submissionURI;

        job.status = JobStatus.SUBMITTED;

        emit WorkSubmitted(_jobId, msg.sender, _submissionURI);
    }

    // =============================================================
    //                APPROVE + RELEASE PAYMENT
    // =============================================================

    function approveWork(uint256 _jobId) external nonReentrant {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        Job storage job = jobs[_jobId];

        require(msg.sender == job.client, "Only client can approve work");

        require(job.status == JobStatus.SUBMITTED, "Work has not been submitted");

        require(job.escrowAmount > 0, "No escrow available");

        uint256 payment = job.escrowAmount;

        // Effects first
        job.escrowAmount = 0;

        job.status = JobStatus.COMPLETED;

        job.completedAt = block.timestamp;

        // Interaction after state updates
        (bool success,) = payable(job.freelancer).call{value: payment}("");

        require(success, "Payment transfer failed");

        emit PaymentReleased(_jobId, job.freelancer, payment);
    }

    // =============================================================
    //                        CANCEL JOB
    // =============================================================

    function cancelJob(uint256 _jobId) external {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        Job storage job = jobs[_jobId];

        require(msg.sender == job.client, "Only client can cancel");

        require(job.status == JobStatus.OPEN || job.status == JobStatus.FREELANCER_SELECTED, "Cannot cancel funded job");

        job.status = JobStatus.CANCELLED;

        emit JobCancelled(_jobId, msg.sender);
    }

    // =============================================================
    //                         VIEW FUNCTIONS
    // =============================================================

    function getApplicationsCount(uint256 _jobId) external view returns (uint256) {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        return applications[_jobId].length;
    }

    function getApplication(uint256 _jobId, uint256 _applicationIndex) external view returns (Application memory) {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        require(_applicationIndex < applications[_jobId].length, "Application does not exist");

        return applications[_jobId][_applicationIndex];
    }

    function getJob(uint256 _jobId) external view returns (Job memory) {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");

        return jobs[_jobId];
    }
}
