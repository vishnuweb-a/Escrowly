import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BrowserProvider } from "ethers";
import { useApp, useResource } from "../hooks";
import {
  readJob,
  readApplications,
  readEvents,
  publishMetadata,
} from "../lib/contract";
import {
  permissions,
  decodeDocument,
  date,
  dateTime,
  daysLeft,
  same,
  eth,
} from "../lib/model";
import { WriteButton } from "./Forms";
import {
  PageHeader,
  SectionCard,
  Button,
  Row,
  ETHAmount,
  WalletAddress,
  JobStatusBadge,
  ProjectTimeline,
  EscrowCard,
  LoadingSkeleton,
  ErrorState,
  EmptyState,
  CallToAction,
  ConfirmationModal,
  ResourceLink,
  FileText,
  ShieldCheck,
  LockKeyhole,
  Users,
  Calendar,
  Code2,
  Check,
  ExplorerLink,
  TransactionHash,
  IconBox,
  Clock,
  Diamond,
  Eye,
} from "../components";
import { EventList } from "./Workspace";
export function ProjectPage({ view = "details" }) {
  const { id } = useParams(),
    app = useApp();
  const state = useResource(
    () => Promise.all([readJob(id), readApplications(id)]),
    [id],
  );
  const [modal, setModal] = useState(null),
    [publishing, setPublishing] = useState(false);
  if (state.loading) return <LoadingSkeleton />;
  if (state.error) return <ErrorState error={state.error} />;
  const [job, applications] = state.data,
    access = permissions(job, app.account),
    applied = applications.some((a) => same(a.applicant, app.account));
  const completed = job.status === 5,
    funded = [2, 3, 4].includes(job.status),
    submission = decodeDocument(job.submissionURI),
    selected = applications.find((a) => same(a.applicant, job.freelancer));
  const execute = async (label, method, args = []) => {
    setModal(null);
    await app.write(label, (c) => c[method](id, ...args));
  };
  const action = (
    <div className="project-actions">
      {!app.account ? (
        <Button onClick={app.connect} className="full">
          Connect Wallet
        </Button>
      ) : (
        <>
          {access.select && (
            <Button to={`/jobs/${id}/applications`}>
              View Applications ({job.count})
            </Button>
          )}
          {access.apply && !applied && (
            <Button to={`/jobs/${id}/apply`}>Apply for Job →</Button>
          )}
          {access.apply && applied && (
            <p className="notice">
              Your application is awaiting client selection.
            </p>
          )}
          {access.fund && (
            <WriteButton onClick={() => setModal({ type: "fund" })}>
              Fund {eth(job.budget)} ETH →
            </WriteButton>
          )}
          {access.start && (
            <WriteButton onClick={() => execute("Start Work", "startWork")}>
              Start Work →
            </WriteButton>
          )}
          {access.submit && (
            <Button to={`/jobs/${id}/submit`}>Submit Work →</Button>
          )}
          {access.approve && (
            <WriteButton onClick={() => setModal({ type: "approve" })}>
              Approve & Release →
            </WriteButton>
          )}
          {access.cancel && (
            <Button
              secondary
              disabled={app.busy || app.wrongNetwork}
              onClick={() => setModal({ type: "cancel" })}
            >
              Cancel Job
            </Button>
          )}
        </>
      )}
      {job.status === 1 && !access.client && (
        <p className="notice">Waiting for client funding.</p>
      )}
      {job.status === 2 && !access.freelancer && (
        <p className="notice">
          Escrow funded. Waiting for the freelancer to start work.
        </p>
      )}
      {job.status === 3 && !access.freelancer && (
        <p className="notice">The freelancer is working on this project.</p>
      )}
      {job.status === 4 && !access.client && (
        <p className="notice">Work submitted. Waiting for client review.</p>
      )}
      {completed && (
        <Button to={`/transactions?job=${id}`}>
          View Payment & Transaction ↗
        </Button>
      )}
    </div>
  );
  const publishDraft = async () => {
    setPublishing(true);
    try {
      const metadata = JSON.parse(
        sessionStorage.getItem(`escrowly-draft-${id}`),
      );
      const signer = await new BrowserProvider(window.ethereum).getSigner(
        app.account,
      );
      await publishMetadata(id, metadata, signer);
      sessionStorage.removeItem(`escrowly-draft-${id}`);
      app.refresh();
    } catch (e) {
      app.setWalletError(e.message);
    } finally {
      setPublishing(false);
    }
  };
  if (view === "applications")
    return (
      <>
        <PageHeader
          back={`/jobs/${id}`}
          title="Applications"
          description={`${job.count} freelancers applied. Review proposals and select the best freelancer for your project.`}
        >
          <div className="header-project">
            <Code2 size={40} />
            <div>
              <h2>{job.title}</h2>
              <ETHAmount value={job.budget} />
            </div>
          </div>
        </PageHeader>
        <main className="container page-body">
          {!access.client ? (
            <EmptyState
              title="Client access required"
              description="Connect the wallet that created this job to manage applications."
              action="Back to Job"
              to={`/jobs/${id}`}
            />
          ) : (
            <>
              <div className="results-heading">
                <h2>{job.count} Applications</h2>
                <JobStatusBadge status={job.status} />
              </div>
              {applications.length ? (
                <div className="application-list">
                  {applications.map((a) => {
                    const doc = decodeDocument(a.proposalURI);
                    return (
                      <SectionCard key={a.index} className="application-card">
                        <div className="applicant">
                          <span className="avatar-disc">
                            <Users size={30} />
                          </span>
                          <div>
                            <h3>Freelancer</h3>
                            <WalletAddress value={a.applicant} />
                          </div>
                        </div>
                        <div>
                          <small>Proposed Price</small>
                          <ETHAmount value={a.proposedPrice} />
                        </div>
                        <div>
                          <small>Estimated Delivery</small>
                          <strong>{String(a.estimatedDuration)} days</strong>
                        </div>
                        <div className="proposal-preview">
                          <p>
                            {doc.text ||
                              "View the proposal reference for details."}
                          </p>
                          <button
                            className="text-link"
                            onClick={() =>
                              setModal({ type: "proposal", application: a })
                            }
                          >
                            Read proposal →
                          </button>
                        </div>
                        <div className="stack">
                          <Button
                            secondary
                            onClick={() =>
                              setModal({ type: "proposal", application: a })
                            }
                          >
                            View Proposal
                          </Button>
                          {access.select && (
                            <WriteButton
                              onClick={() =>
                                setModal({ type: "select", application: a })
                              }
                            >
                              Select Freelancer
                            </WriteButton>
                          )}
                        </div>
                      </SectionCard>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No applications yet."
                  description="Freelancers who apply to this job will appear here."
                />
              )}
            </>
          )}
          <CallToAction title="Ready to hire top talent?" />
        </main>
        {renderModal()}
      </>
    );
  const detail = view === "details" && job.status === 0;
  return (
    <>
      <PageHeader
        className={detail ? "job-detail-header" : ""}
        compact={detail || view === "project" || job.status === 4}
        back="/dashboard"
        crumbs={detail ? [["Explore", "/explore"], [job.title]] : undefined}
        pill={
          detail ? (
            <span className="header-pill">
              <JobStatusBadge status={job.status} />
            </span>
          ) : undefined
        }
        meta={
          detail ? (
            <>
              <div>
                <IconBox icon={Users} />
                <div>
                  <small>Client</small>
                  <WalletAddress value={job.client} />
                </div>
              </div>
              <div>
                <IconBox icon={Calendar} />
                <div>
                  <small>Posted</small>
                  <strong>{date(job.createdAt)}</strong>
                </div>
              </div>
              <div>
                <IconBox icon={Clock} />
                <div>
                  <small>Deadline</small>
                  <strong>{date(job.deadline)}</strong>
                </div>
              </div>
            </>
          ) : undefined
        }
        eyebrow={
          completed ? "PROJECT COMPLETE" : `PROJECT #${id} · ETHEREUM SEPOLIA`
        }
        title={
          completed ? (
            <>
              Great work
              <br />
              together<span className="accent">!</span>
            </>
          ) : job.status === 1 && view === "fund" ? (
            <>
              Fund Escrow.
              <br />
              Keep Work Moving<span className="accent">.</span>
            </>
          ) : (
            job.title
          )
        }
        description={
          completed
            ? "The project has been completed successfully. Funds have been released to the freelancer."
            : job.status === 1 && view === "fund"
              ? "Lock funds securely on-chain and give your freelancer the confidence to start working."
              : job.description.split("\n")[0].slice(0, 240)
        }
      >
        {completed ? (
          <div className="completion-panel">
            <span className="completion-check">
              <Check size={52} />
            </span>
            <h2>PROJECT COMPLETED</h2>
            <p>
              The work has been approved and payment
              <br />
              has been released to the freelancer.
            </p>
            <div>
              <span>
                <Check size={18} />
                <b>Work Approved</b>
                <small>Client approved the delivered work</small>
              </span>
              <span>
                <Check size={18} />
                <b>Payment Released</b>
                <small>{eth(job.budget)} ETH sent to freelancer</small>
              </span>
            </div>
          </div>
        ) : detail ? (
          <div />
        ) : (
          <div className="header-project">
            <IconBoxLocal />
            <div>
              <JobStatusBadge status={job.status} />
              <p>
                {funded
                  ? "Funds locked in smart contract"
                  : job.status === 1
                    ? "Ready to fund escrow"
                    : "Transparent on-chain project"}
              </p>
            </div>
          </div>
        )}
      </PageHeader>
      {completed && (
        <div className="trust-strip four">
          <div className="container">
            {[
              [
                LockKeyhole,
                "Secure & Transparent",
                "All activity is recorded on-chain and publicly verifiable.",
              ],
              [
                Eye,
                "Work Delivered",
                "The freelancer submitted the deliverable for review.",
              ],
              [
                ShieldCheck,
                "Payment Released",
                "Funds have been sent to the freelancer's wallet.",
              ],
              [
                Users,
                "Client Approved",
                "The client reviewed and approved the work.",
              ],
            ].map(([Icon, title, text]) => (
              <div key={title}>
                <IconBox icon={Icon} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <main
        className={`container page-body ${detail ? "job-detail-body" : ""}`}
      >
        {access.client && sessionStorage.getItem(`escrowly-draft-${id}`) && (
          <div className="notice draft-notice">
            <span>
              Your job is confirmed on-chain. Publish its saved description with
              a free wallet signature.
            </span>
            <Button
              disabled={publishing || app.wrongNetwork}
              onClick={publishDraft}
            >
              {publishing
                ? "Waiting for signature…"
                : "Publish Project Details"}
            </Button>
          </div>
        )}
        {!detail && !completed && job.status !== 1 && job.status !== 4 && (
          <div className="project-stats">
            {[
              [Users, "Client Wallet", <WalletAddress value={job.client} />],
              [
                Users,
                "Freelancer Wallet",
                <WalletAddress value={job.freelancer} />,
              ],
              [
                Diamond,
                "Escrow Amount",
                <>
                  <ETHAmount value={job.escrowAmount} />
                  {funded && <span className="locked-pill">LOCKED</span>}
                </>,
              ],
              [
                Calendar,
                "Deadline",
                <>
                  {date(job.deadline)}
                  <small className="stat-sub">
                    {daysLeft(job.deadline) > 0
                      ? `in ${daysLeft(job.deadline)} days`
                      : "Deadline passed"}
                  </small>
                </>,
              ],
              [Clock, "Status", <JobStatusBadge status={job.status} />],
            ].map(([Icon, label, value]) => (
              <SectionCard key={label} className="stat-card">
                <IconBox icon={Icon} />
                <div>
                  <small>{label}</small>
                  <div>{value}</div>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
        <div className={`two-column ${completed ? "equal-columns" : ""}`}>
          <div className="stack">
            {detail ? (
              <SectionCard className="project-description">
                <section>
                  <h2>
                    <FileText />
                    About This Project
                  </h2>
                  <p className="preserve-lines">{job.description}</p>
                </section>
                <section>
                  <h2>
                    <Code2 />
                    Required Skills
                  </h2>
                  <div className="tags">
                    {job.skills.length ? (
                      job.skills.map((s) => <span key={s}>{s}</span>)
                    ) : (
                      <p className="muted">No skills published.</p>
                    )}
                  </div>
                </section>
                <section>
                  <h2>
                    <FileText />
                    Project Requirements
                  </h2>
                  {job.metadata?.requirements ? (
                    <ul className="check-list">
                      {job.metadata.requirements
                        .split("\n")
                        .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={i}>
                            <Check size={13} />
                            {line}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="muted">
                      Discuss deliverables with the client before applying.
                    </p>
                  )}
                </section>
                <div className="form-row">
                  <SectionCard title="Project Deadline" icon={Calendar}>
                    <div className="notice">
                      <strong>
                        {daysLeft(job.deadline) > 0
                          ? `${daysLeft(job.deadline)} days left`
                          : "Deadline passed"}
                      </strong>
                      <p>Due {date(job.deadline)}</p>
                    </div>
                  </SectionCard>
                  <SectionCard title="Attachments" icon={FileText}>
                    {job.metadata?.attachments?.length ? (
                      job.metadata.attachments.map((link) => (
                        <ResourceLink key={link} value={link} />
                      ))
                    ) : (
                      <p className="muted">No attachment links provided.</p>
                    )}
                  </SectionCard>
                </div>
              </SectionCard>
            ) : job.status === 1 ? (
              <SectionCard title={job.title} icon={FileText}>
                <Row label="Freelancer">
                  <WalletAddress value={job.freelancer} />
                </Row>
                <Row label="Agreed Amount">
                  <ETHAmount value={job.budget} large />
                </Row>
                <Row label="Estimated Delivery">
                  {selected ? `${selected.estimatedDuration} days` : "—"}
                </Row>
                <div className="fund-balance">
                  <LockKeyhole size={40} />
                  <div>
                    <p>Escrow Balance</p>
                    <ETHAmount value={job.escrowAmount} large />
                  </div>
                  <span className="badge status-1">Awaiting Funding</span>
                </div>
                {action}
                <p className="secure-note">
                  <LockKeyhole />
                  Funds will remain locked until the client approves the
                  submitted work.
                </p>
                <TrustLocal />
              </SectionCard>
            ) : completed ? (
              <SectionCard title="Project Details" icon={FileText}>
                <Row label="Project Title">{job.title}</Row>
                <Row label="Client">
                  <WalletAddress value={job.client} />
                </Row>
                <Row label="Freelancer">
                  <WalletAddress value={job.freelancer} />
                </Row>
                <Row label="Final Agreed Amount">
                  <ETHAmount value={job.budget} />
                </Row>
                <Row label="Completion Date">{date(job.completedAt)}</Row>
                <Row label="Submission">
                  <ResourceLink value={submission.url} />
                </Row>
                <PaymentEvidence id={id} />
                {action}
              </SectionCard>
            ) : job.status === 4 ? (
              <>
                <SectionCard className="submission-panel">
                  <div className="section-heading">
                    <span className="submission-icon">
                      <FileText size={48} />
                      <Check size={24} />
                    </span>
                    <div>
                      <div className="eyebrow">CLIENT REVIEW</div>
                      <h2>WORK SUBMITTED</h2>
                      <p>The freelancer has submitted work for review.</p>
                    </div>
                  </div>
                  <Row label="Submitted by">
                    <WalletAddress value={job.freelancer} />
                  </Row>
                  <Row label="Submission">
                    <ResourceLink value={submission.url} />
                  </Row>
                  <Row label="Escrow Amount">
                    <ETHAmount value={job.escrowAmount} />
                  </Row>
                  <Row label="Status">
                    <span className="badge status-1">
                      Awaiting Client Review
                    </span>
                  </Row>
                </SectionCard>
                <SectionCard title="Submission Details" icon={FileText}>
                  <p className="preserve-lines">
                    {submission.note || "No additional submission note."}
                  </p>
                  <ResourceLink value={submission.url}>
                    Open deliverable ↗
                  </ResourceLink>
                </SectionCard>
                <SectionCard title="Your Review" icon={ShieldCheck}>
                  <p className="muted mb-5">
                    Review the deliverable before approving. Approval releases
                    the full escrow amount to the freelancer.
                  </p>
                  {action}
                </SectionCard>
              </>
            ) : (
              <>
                <ProjectTimeline job={job} detailed />
                <SectionCard title="Next Step" icon={LockKeyhole}>
                  {action}
                </SectionCard>
              </>
            )}
            {[2, 3].includes(job.status) && (
              <SectionCard
                title="Transaction History"
                subtitle="Confirmed activity from the escrow contract."
              >
                <EventList jobId={id} limit={3} />
                <Link className="text-link" to={`/transactions?job=${id}`}>
                  View all transactions ↗
                </Link>
              </SectionCard>
            )}
          </div>
          <aside className="sidebar">
            {completed ? (
              <>
                <SectionCard title="Payment Details" icon={ShieldCheck}>
                  <div className="payment-confirmed">
                    <ETHAmount value={job.budget} large />
                    <span className="badge status-5">
                      ✓ Transaction confirmed
                    </span>
                    <p>Sent to freelancer · {dateTime(job.completedAt)}</p>
                  </div>
                </SectionCard>
                <ProjectTimeline job={job} />
              </>
            ) : detail ? (
              <>
                <EscrowCard job={job}>{action}</EscrowCard>
                <SectionCard title="Job State">
                  <div className="job-state-summary">
                    {[
                      ["Open", "Accepting applications"],
                      ["In Progress", "Work has started"],
                      ["Under Review", "Client reviews work"],
                      ["Completed", "Funds released"],
                      ["Cancelled", "Job was cancelled"],
                    ].map(([label, text], index) => (
                      <div className={index === 0 ? "current" : ""} key={label}>
                        <span className="state-dot" />
                        <strong>{label}</strong>
                        <small>{text}</small>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </>
            ) : job.status === 1 || job.status === 4 ? (
              <ProjectTimeline job={job} />
            ) : (
              <>
                <SectionCard title="Escrow Status" icon={LockKeyhole}>
                  <ETHAmount value={job.escrowAmount} large />
                  <p className="muted">
                    {funded ? "Locked in Smart Contract" : "No funds locked"}
                  </p>
                  <p className="muted mt-5">
                    Payment is released only when the client approves submitted
                    work.
                  </p>
                  {funded && (
                    <ol className="escrow-track" aria-label="Escrow progress">
                      {[
                        ["Funded", "Locked on-chain"],
                        ["In Progress", "With freelancer"],
                        ["To Be Released", "After approval"],
                      ].map(([label, text], i) => {
                        // Funded (2): funds locked. In progress (3): work is the
                        // current step. Submitted (4): release is the current step.
                        const done = i === 0 || (i === 1 && job.status === 4);
                        const current = i === job.status - 2;
                        return (
                          <li
                            key={label}
                            className={done ? "done" : current ? "current" : ""}
                          >
                            <span>{done && <Check size={13} />}</span>
                            <strong>{label}</strong>
                            <small>{text}</small>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <ExplorerLink
                    value={app.config?.address}
                    type="address"
                    className="button secondary full mt-6"
                  >
                    View on Sepolia Explorer
                  </ExplorerLink>
                  {funded && (
                    <p className="money-safe">
                      <ShieldCheck size={22} />
                      <span>
                        <strong>Your money is safe</strong>
                        Funds are only released when the client approves the
                        work.
                      </span>
                    </p>
                  )}
                </SectionCard>
                <SectionCard title="Project Details">
                  <Row label="Project Title">{job.title}</Row>
                  <Row label="Budget">
                    <ETHAmount value={job.budget} />
                  </Row>
                  <Row label="Deadline">{date(job.deadline)}</Row>
                  <Row label="Created">{date(job.createdAt)}</Row>
                  <Row label="Project ID">#{id}</Row>
                </SectionCard>
              </>
            )}
            <SectionCard title="Secure & Transparent" icon={ShieldCheck}>
              <p className="muted">
                All escrow transactions are recorded on-chain. Human review is
                required before payment.
              </p>
              <Link to="/help" className="text-link">
                How escrow works →
              </Link>
            </SectionCard>
          </aside>
        </div>
        {!detail && (
          <CallToAction
            completed={completed}
            title={
              completed
                ? "Ready for your next project?"
                : "Ready to build something great?"
            }
          />
        )}
      </main>
      {renderModal()}
    </>
  );
  function renderModal() {
    if (!modal) return null;
    const close = () => setModal(null),
      a = modal.application;
    if (modal.type === "proposal") {
      const doc = decodeDocument(a.proposalURI);
      return (
        <ConfirmationModal
          title="Freelancer Proposal"
          confirm="Done"
          onClose={close}
          onConfirm={close}
        >
          <WalletAddress value={a.applicant} />
          <p className="preserve-lines">{doc.text || "Proposal reference"}</p>
          <ResourceLink value={doc.url} />
          <Row label="Price">
            <ETHAmount value={a.proposedPrice} />
          </Row>
          <Row label="Estimated delivery">
            {String(a.estimatedDuration)} days
          </Row>
        </ConfirmationModal>
      );
    }
    if (modal.type === "select")
      return (
        <ConfirmationModal
          title="Select Freelancer?"
          confirm="Select Freelancer"
          onClose={close}
          onConfirm={() =>
            execute("Select Freelancer", "selectFreelancer", [a.index])
          }
        >
          <p>
            Are you sure you want to select this freelancer for your project?
          </p>
          <Row label="Wallet">
            <WalletAddress value={a.applicant} />
          </Row>
          <Row label="Agreed Price">
            <ETHAmount value={a.proposedPrice} />
          </Row>
          <Row label="Estimated Delivery">
            {String(a.estimatedDuration)} days
          </Row>
          <p className="notice">
            After selection, new applications will no longer be accepted.
          </p>
        </ConfirmationModal>
      );
    if (modal.type === "approve")
      return (
        <ConfirmationModal
          title="Approve this work?"
          confirm={`Approve & Release ${eth(job.escrowAmount)} ETH`}
          onClose={close}
          onConfirm={() => execute("Approve & Release", "approveWork")}
        >
          <p>
            This will release <b>{eth(job.escrowAmount)} ETH</b> to{" "}
            <WalletAddress value={job.freelancer} /> and mark the project as
            completed.
          </p>
          <p className="notice warning">
            This blockchain transaction cannot be reversed. Make sure you are
            satisfied with the work.
          </p>
        </ConfirmationModal>
      );
    if (modal.type === "fund")
      return (
        <ConfirmationModal
          title="Fund Escrow?"
          confirm={`Fund ${eth(job.budget)} ETH`}
          onClose={close}
          onConfirm={() =>
            execute("Fund Escrow", "fundEscrow", [{ value: job.budget }])
          }
        >
          <ETHAmount value={job.budget} large />
          <p>
            Funds will be transferred to the smart contract and held until you
            approve submitted work.
          </p>
          <p className="notice">
            This contract has no cancellation or refund action after funding.
          </p>
        </ConfirmationModal>
      );
    return (
      <ConfirmationModal
        title="Cancel this job?"
        confirm="Cancel Job"
        onClose={close}
        onConfirm={() => execute("Cancel Job", "cancelJob")}
      >
        <p>
          This will close the job to applications. No escrow funds have been
          deposited.
        </p>
      </ConfirmationModal>
    );
  }
}
function IconBoxLocal() {
  return (
    <span className="header-lock">
      <LockKeyhole size={48} />
    </span>
  );
}
function PaymentEvidence({ id }) {
  const state = useResource(() => readEvents(id), [id]);
  if (state.loading) return <p className="muted">Reading payment receipt…</p>;
  if (state.error)
    return (
      <p className="form-error">
        Payment history unavailable.{" "}
        <Link to={`/transactions?job=${id}`}>Retry from Transactions</Link>
      </p>
    );
  const created = state.data.find((event) => event.name === "JobCreated");
  const payment = state.data.find((event) => event.name === "PaymentReleased");
  return (
    <>
      {created && (
        <Row label="Original Budget">
          <ETHAmount value={created.args.budget} />
        </Row>
      )}
      {payment && (
        <Row label="Payment Transaction">
          <TransactionHash value={payment.hash} />
        </Row>
      )}
    </>
  );
}
function TrustLocal() {
  return (
    <div className="fund-trust">
      <span>
        <ShieldCheck />
        Secure by smart contract
      </span>
      <span>
        <Users />
        No middlemen
      </span>
      <span>
        <FileText />
        Built for trust
      </span>
    </div>
  );
}
