import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, useResource } from "../hooks";
import {
  readJob,
  readApplications,
  publishMetadata,
  abi,
} from "../lib/contract";
import { Interface } from "ethers";
import {
  amount,
  date,
  eth,
  permissions,
  same,
  safeURL,
  encodeDocument,
} from "../lib/model";
import {
  PageHeader,
  TrustFeatures,
  SectionCard,
  Field,
  Row,
  Button,
  NetworkBadge,
  ETHAmount,
  IconBox,
  FileText,
  LockKeyhole,
  ShieldCheck,
  ArrowRight,
  Wallet,
  LoadingSkeleton,
  ErrorState,
  ConfirmationModal,
  EmptyState,
} from "../components";
export function WriteButton({ children, ...props }) {
  const app = useApp();
  if (!app.account)
    return (
      <Button type="button" className="full" onClick={app.connect}>
        <Wallet size={18} />
        Connect Wallet
      </Button>
    );
  return (
    <Button
      className="full"
      disabled={app.busy || app.wrongNetwork || !app.config}
      {...props}
    >
      {app.busy ? "Confirming transaction…" : children}
    </Button>
  );
}
export function CreateJob() {
  const app = useApp(),
    navigate = useNavigate();
  const [form, setForm] = useState({
      title: "",
      description: "",
      skills: "",
      budget: "",
      deadline: "",
      requirements: "",
      attachments: "",
    }),
    [error, setError] = useState("");
  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const budget = amount(form.budget),
        deadline = Math.floor(new Date(form.deadline).getTime() / 1000);
      if (!Number.isFinite(deadline) || deadline <= Date.now() / 1000)
        throw new Error("Choose a deadline in the future.");
      const attachments = form.attachments
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (attachments.some((s) => !safeURL(s)))
        throw new Error("Attachment links must use HTTPS, HTTP, or IPFS.");
      const metadata = {
        title: form.title.trim(),
        description: form.description.trim(),
        skills: [
          ...new Set(
            form.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ],
        requirements: form.requirements,
        attachments,
      };
      await app.write(
        "Create Job",
        (c) => c.createJob(budget, deadline),
        async (receipt, signer) => {
          const iface = new Interface(abi);
          const event = receipt.logs
            .map((l) => {
              try {
                return iface.parseLog(l);
              } catch {
                return null;
              }
            })
            .find((l) => l?.name === "JobCreated");
          if (!event)
            throw new Error("Job confirmed. Open the dashboard to find it.");
          const id = String(event.args.jobId);
          sessionStorage.setItem(
            `escrowly-draft-${id}`,
            JSON.stringify(metadata),
          );
          navigate(`/jobs/${id}`);
          await publishMetadata(id, metadata, signer);
          sessionStorage.removeItem(`escrowly-draft-${id}`);
        },
      );
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="HIRE TOP TALENT WITH CONFIDENCE"
        title={
          <>
            Create a New Job<span className="accent">.</span>
          </>
        }
        description="Describe your project, set the terms, and get matched with talented freelancers. All secured by smart contracts."
      >
        <TrustFeatures />
      </PageHeader>
      <main className="container page-body">
        <form onSubmit={submit} className="two-column">
          <SectionCard
            title="Job Details"
            icon={FileText}
            subtitle="Be clear and detailed to attract the right talent."
          >
            <div className="form-fields">
              <Field
                label="Job Title"
                required
                value={form.title}
                onChange={update("title")}
                maxLength={100}
                placeholder="e.g. Build a DeFi Dashboard UI"
              />
              <Field
                label="Description"
                required
                hint="Include your goals, deliverables, and specific requirements."
              >
                <textarea
                  required
                  value={form.description}
                  onChange={update("description")}
                  maxLength={10000}
                  rows={6}
                  placeholder="Tell freelancers about your project…"
                />
              </Field>
              <Field
                label="Required Skills"
                required
                value={form.skills}
                onChange={update("skills")}
                maxLength={300}
                placeholder="React, Tailwind CSS, Web3, UI/UX"
                hint="Separate each skill with a comma."
              />
              <div className="form-row">
                <Field
                  label="Budget (ETH)"
                  required
                  inputMode="decimal"
                  value={form.budget}
                  onChange={update("budget")}
                  placeholder="0.50"
                />
                <Field
                  label="Deadline"
                  required
                  type="datetime-local"
                  value={form.deadline}
                  onChange={update("deadline")}
                />
              </div>
              <Field label="Additional Requirements">
                <textarea
                  value={form.requirements}
                  onChange={update("requirements")}
                  rows={4}
                  maxLength={4000}
                  placeholder="Additional requirements, preferences, or notes…"
                />
              </Field>
              <Field
                label="Attachments"
                hint="Paste hosted file or IPFS links, one per line. Files are not uploaded by this app."
              >
                <textarea
                  value={form.attachments}
                  onChange={update("attachments")}
                  rows={3}
                  maxLength={3000}
                  placeholder="https://…"
                />
              </Field>
            </div>
          </SectionCard>
          <aside className="sidebar">
            <SectionCard>
              <div className="eyebrow">JOB SUMMARY</div>
              <h2 className="mt-4">
                {form.title || "Your next great project"}
              </h2>
              <p className="muted summary-description">
                {form.description ||
                  "Your project description will appear here."}
              </p>
              <Row label="Budget">
                <strong>{form.budget || "0.00"} ETH</strong>
              </Row>
              <Row label="Deadline">
                {form.deadline
                  ? date(new Date(form.deadline).getTime() / 1000)
                  : "Not set"}
              </Row>
              <Row label="Network">
                <NetworkBadge />
              </Row>
              <Row label="Skills">
                <div className="tags">
                  {form.skills
                    .split(",")
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((s, i) => (
                      <span key={i}>{s.trim()}</span>
                    ))}
                </div>
              </Row>
            </SectionCard>
            <SectionCard
              className="tinted"
              title="Transaction Preview"
              icon={LockKeyhole}
            >
              <p className="muted">
                Create the job on Sepolia. Fund escrow separately after
                selecting a freelancer.
              </p>
              <Row label="Action">Create Job</Row>
              <Row label="ETH transferred">0 ETH + network gas</Row>
              <p className="notice">
                After confirmation, sign a free wallet message to publish your
                project description.
              </p>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <WriteButton type="submit">
                Create Job
                <ArrowRight size={18} />
              </WriteButton>
              <p className="secure-note">
                <ShieldCheck size={18} />A wallet transaction is required to
                create this job.
              </p>
            </SectionCard>
          </aside>
        </form>
      </main>
    </>
  );
}
export function JobForm({ mode }) {
  const { id } = useParams();
  const app = useApp(),
    navigate = useNavigate();
  const state = useResource(
    () => Promise.all([readJob(id), readApplications(id)]),
    [id],
  );
  const [form, setForm] = useState({
      price: "",
      duration: "",
      proposal: "",
      uri: "",
      note: "",
    }),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  if (state.loading) return <LoadingSkeleton />;
  if (state.error) return <ErrorState error={state.error} />;
  const [job, applications] = state.data,
    access = permissions(job, app.account),
    apply = mode === "apply",
    alreadyApplied = applications.some((a) => same(a.applicant, app.account));
  const allowed = apply
    ? job.status === 0 && !access.client && !alreadyApplied
    : access.submit;
  const execute = async () => {
    setConfirm(false);
    setError("");
    try {
      const payload = apply
        ? encodeDocument({ text: form.proposal.trim(), url: form.uri.trim() })
        : encodeDocument({ url: form.uri.trim(), note: form.note.trim() });
      const receipt = await app.write(
        apply ? "Submit Application" : "Submit Work",
        (c) =>
          apply
            ? c.applyForJob(
                id,
                amount(form.price),
                BigInt(form.duration),
                payload,
              )
            : c.submitWork(id, payload),
      );
      if (receipt) navigate(`/jobs/${id}${apply ? "" : "/project"}`);
    } catch (e) {
      setError(e.message);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    setError("");
    try {
      if (form.uri && !safeURL(form.uri))
        throw new Error("Use a valid HTTPS or IPFS link.");
      if (!apply && !form.uri.trim())
        throw new Error("Enter a submission link.");
      if (apply) {
        amount(form.price);
        if (!/^\d+$/.test(form.duration) || BigInt(form.duration) < 1n)
          throw new Error("Enter a whole number of days greater than zero.");
        execute();
      } else setConfirm(true);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <PageHeader
        title={apply ? "Apply for Job" : "Submit Work"}
        description={
          apply
            ? "Submit your proposal and get started on a secure, transparent collaboration."
            : "Share your final deliverable for the client to review."
        }
        back={`/jobs/${id}`}
      >
        <TrustFeatures />
      </PageHeader>
      <main className="container page-body">
        {!allowed ? (
          <EmptyState
            title={
              alreadyApplied
                ? "Application submitted"
                : "This action is not available."
            }
            description={
              alreadyApplied
                ? "Your application is recorded on-chain. The client will select a freelancer."
                : "Connect the correct wallet and check the current project state."
            }
            action="Back to Project"
            to={`/jobs/${id}`}
          />
        ) : (
          <form className="two-column" onSubmit={submit}>
            <div className="stack">
              <SectionCard>
                <div className="flex justify-between gap-4">
                  <div>
                    <h2>{job.title}</h2>
                    <div className="tags">
                      {job.skills.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <ETHAmount value={job.budget} />
                </div>
                <p className="muted mt-5">{job.description}</p>
              </SectionCard>
              <SectionCard
                title={apply ? "Your Application" : "Your Deliverable"}
              >
                <div className="form-fields">
                  {apply && (
                    <>
                      <Field
                        label="Proposed Price (ETH)"
                        required
                        hint="Enter the amount you’ll complete this work for."
                        inputMode="decimal"
                        value={form.price}
                        onChange={update("price")}
                        placeholder="0.40"
                      />
                      <Field
                        label="Estimated Duration (days)"
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={form.duration}
                        onChange={update("duration")}
                        placeholder="7"
                      />
                      <Field
                        label="Proposal"
                        required
                        hint="Tell the client why you’re the best fit for this job."
                      >
                        <textarea
                          required
                          maxLength={6000}
                          rows={6}
                          value={form.proposal}
                          onChange={update("proposal")}
                          placeholder="Describe your approach, experience, and deliverables…"
                        />
                      </Field>
                    </>
                  )}
                  <Field
                    label={
                      apply
                        ? "Proposal Reference / URI (optional)"
                        : "Work URL / Submission URI"
                    }
                    required={!apply}
                    value={form.uri}
                    onChange={update("uri")}
                    maxLength={2000}
                    placeholder="https://github.com/… or ipfs://…"
                  />
                  {!apply && (
                    <Field label="Submission Note">
                      <textarea
                        rows={5}
                        maxLength={5000}
                        value={form.note}
                        onChange={update("note")}
                        placeholder="What did you deliver? Include setup or review instructions."
                      />
                    </Field>
                  )}
                  <p className="notice">
                    Your {apply ? "proposal" : "submission"} and notes will be
                    public on-chain.
                  </p>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>
            <aside className="sidebar">
              <SectionCard
                title={apply ? "Application Summary" : "Submission Summary"}
                icon={FileText}
              >
                <Row label="Job Budget">
                  <ETHAmount value={job.budget} />
                </Row>
                {apply && (
                  <>
                    <Row label="Your Proposal">
                      <strong>{form.price || "0.00"} ETH</strong>
                    </Row>
                    <Row label="Estimated Duration">
                      {form.duration || "—"} days
                    </Row>
                    {Number(form.price) > 0 &&
                      Number(form.price) < Number(eth(job.budget)) && (
                        <p className="notice">
                          Your proposal is below the client’s budget.
                        </p>
                      )}
                  </>
                )}
                <h3 className="mt-6">Next Steps</h3>
                <ol className="next-steps">
                  <li>
                    Confirm your {apply ? "application" : "submission"} in your
                    wallet.
                  </li>
                  <li>Wait for Sepolia confirmation.</li>
                  <li>
                    The client reviews your {apply ? "proposal" : "work"}.
                  </li>
                </ol>
              </SectionCard>
              <SectionCard title="Transaction" icon={Wallet}>
                <p className="muted mb-5">
                  {apply
                    ? "No escrow funds are charged at this stage. Network gas fees apply."
                    : "Submitting work enables client review. Payment is released only after client approval."}
                </p>
                <WriteButton type="submit">
                  {apply ? "Submit Application" : "Submit Work"}
                  <ArrowRight size={18} />
                </WriteButton>
              </SectionCard>
            </aside>
          </form>
        )}
      </main>
      {confirm && (
        <ConfirmationModal
          title="Submit final work?"
          confirm="Submit Work"
          onClose={() => setConfirm(false)}
          onConfirm={execute}
        >
          <p>
            Once submitted, the client can review your deliverable and approve
            payment.
          </p>
          <p className="notice">
            Check your link carefully. This contract does not support replacing
            a submission.
          </p>
        </ConfirmationModal>
      )}
    </>
  );
}
