import { cloneElement, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Wallet,
  LockKeyhole,
  ShieldCheck,
  Eye,
  Users,
  Copy,
  Check,
  X,
  Menu,
  LogOut,
  ExternalLink,
  CircleAlert,
  LoaderCircle,
  FileText,
  Search,
  Calendar,
  Code2,
  ChevronDown,
  Atom,
  Palette,
  Globe,
  Send,
  Bot,
  Smartphone,
  Server,
  BarChart3,
  Database,
  CircleDot,
  User,
  Clock,
  Diamond,
} from "lucide-react";
import { useApp, useResource } from "./hooks";
import { readEvents } from "./lib/contract";
import {
  STATUSES,
  short,
  eth,
  date,
  dateTime,
  daysLeft,
  present,
  safeURL,
} from "./lib/model";
export function IconBox({ icon: Icon = LockKeyhole, lime = false, children }) {
  return (
    <span className={`icon-box ${lime ? "lime" : ""}`}>
      {children || <Icon size={26} strokeWidth={1.8} />}
    </span>
  );
}
export function Logo({ tone = "light" }) {
  return (
    <Link to="/" className="logo" aria-label="Escrowly home">
      <img
        src={`/logo-mark-${tone}.png`}
        width="37"
        height="38"
        alt=""
        aria-hidden="true"
      />
      <span>Escrowly</span>
    </Link>
  );
}
export function Button({ to, children, secondary, className = "", ...props }) {
  const classes = `button ${secondary ? "secondary" : "primary"} ${className}`;
  return to ? (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
export function NetworkBadge() {
  const { wrongNetwork } = useApp();
  return (
    <span className={`network ${wrongNetwork ? "wrong" : ""}`}>
      <i />
      {wrongNetwork ? "Wrong network" : "Sepolia"}
    </span>
  );
}
export function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="icon-button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}
export function WalletAddress({ value, copy = true }) {
  return (
    <span className="address" title={value}>
      {present(value) ? (
        <>
          <span>{short(value)}</span>
          {copy && <CopyButton value={value} />}
        </>
      ) : (
        "Not selected"
      )}
    </span>
  );
}
export function ExplorerLink({ value, type = "tx", children, className = "" }) {
  const { config } = useApp();
  if (!config || !value) return null;
  return (
    <a
      href={`${config.explorer}/${type}/${value}`}
      className={`external ${className}`}
      target="_blank"
      rel="noreferrer"
    >
      {children || short(value)}
      <ArrowUpRight size={15} />
    </a>
  );
}
export function TransactionHash({ value }) {
  return (
    <span className="address">
      <ExplorerLink value={value} />
      <CopyButton value={value} />
    </span>
  );
}
export function ETHAmount({ value, large = false }) {
  return (
    <strong className={large ? "eth-large" : "eth"}>
      {eth(value)} <span>ETH</span>
    </strong>
  );
}
export function JobStatusBadge({ status }) {
  return (
    <span className={`badge job-status status-${status}`}>
      <i />
      {STATUSES[status] || "Unknown state"}
    </span>
  );
}
export function WalletConnectButton() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <div className="wallet-control" ref={ref}>
      <Button
        onClick={() => (app.account ? setOpen(!open) : app.connect())}
        disabled={app.connecting}
        aria-expanded={app.account ? open : undefined}
      >
        <Wallet size={18} />
        <span>
          {app.account
            ? short(app.account)
            : app.connecting
              ? "Waiting for Wallet"
              : "Connect Wallet"}
        </span>
        {app.account && <ChevronDown size={15} />}
      </Button>
      {open && app.account && (
        <div className="wallet-dropdown">
          <small>CONNECTED WALLET</small>
          <WalletAddress value={app.account} />
          <NetworkBadge />
          <ExplorerLink type="address" value={app.account}>
            View on Explorer
          </ExplorerLink>
          <button
            onClick={() => {
              app.disconnect();
              setOpen(false);
            }}
          >
            <LogOut size={17} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Logo />
        <nav
          className={open ? "nav-links mobile-open" : "nav-links"}
          aria-label="Main navigation"
        >
          {[
            ["/explore", "Explore"],
            ["/create", "Create Job"],
            ["/dashboard", "Dashboard"],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <NetworkBadge />
          <WalletConnectButton />
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <Logo tone="dark" />
        <span className="muted">Freelance work. Secured by code.</span>
        <nav aria-label="Footer">
          <Link to="/explore">Explore</Link>
          <Link to="/create">Create Job</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/transactions">Transactions</Link>
          <Link to="/help">How it works</Link>
        </nav>
        <span className="footer-network">Ethereum Sepolia · Testnet</span>
      </div>
    </footer>
  );
}
export function TrustFeatures({ compact = false }) {
  return (
    <div className={`trust-features ${compact ? "compact" : ""}`}>
      {[
        [LockKeyhole, "Funds protected", "Payment held in escrow"],
        [ShieldCheck, "Transparent process", "Every step recorded on-chain"],
        [Users, "Global talent", "Work with real opportunities"],
      ].map(([Icon, title, text]) => (
        <div key={title}>
          <IconBox icon={Icon} />
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export function PageHeader({
  eyebrow = "A TRUSTED FREELANCE ESCROW PLATFORM",
  title,
  description,
  children,
  back,
  crumbs,
  pill,
  meta,
  compact = false,
  className = "",
}) {
  return (
    <section
      className={`page-header ${compact ? "short-header" : ""} ${className}`}
    >
      <div className="container">
        {crumbs ? (
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map(([label, to]) =>
              to ? (
                <Link key={label} to={to}>
                  {label}
                </Link>
              ) : (
                <span key={label} aria-current="page">
                  {label}
                </span>
              ),
            )}
          </nav>
        ) : (
          back && (
            <Link className="back" to={back}>
              ← Back to {back === "/dashboard" ? "Dashboard" : "Job Details"}
            </Link>
          )
        )}
        <div className="header-grid">
          <div>
            {pill || <div className="eyebrow">{eyebrow}</div>}
            <h1>{title}</h1>
            {description && <p className="lead">{description}</p>}
            {meta && <div className="header-meta">{meta}</div>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
export function SectionCard({
  children,
  title,
  icon: Icon,
  className = "",
  subtitle,
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="section-heading">
          {Icon && <IconBox icon={Icon} />}
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
export function Field({ label, hint, children, required, ...props }) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b className="required"> *</b>}
      </span>
      {hint && <small>{hint}</small>}
      {children ? (
        cloneElement(children, { "aria-label": label })
      ) : (
        <input aria-label={label} required={required} {...props} />
      )}
    </label>
  );
}
export function Row({ label, icon: Icon, children }) {
  return (
    <div className="data-row">
      <span>
        {Icon && (
          <span className="row-icon">
            <Icon size={18} />
          </span>
        )}
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({
  title = "No jobs yet.",
  description = "Be the first client to create a project.",
  action,
  to,
}) {
  return (
    <div className="empty-state">
      <IconBox icon={Search} />
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <Button to={to}>
          {action}
          <ArrowRight size={17} />
        </Button>
      )}
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div
      className="container loading"
      aria-label="Reading contract"
      role="status"
    >
      <span className="sr-only">Reading contract…</span>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function ErrorState({ error }) {
  const { refresh } = useApp();
  return (
    <div className="container">
      <div className="error-state" role="alert">
        <CircleAlert />
        <h2>Couldn’t read the contract</h2>
        <p>{error}</p>
        <Button secondary onClick={refresh}>
          Try again
        </Button>
      </div>
    </div>
  );
}
export function CallToAction({
  title = "Have a project to post?",
  text = "Create a job and get matched with talented freelancers.",
  completed = false,
}) {
  return (
    <section className="cta">
      <div>
        <div className="eyebrow">BUILD A BETTER, MORE OPEN WORK ECONOMY</div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <Button to={completed ? "/explore" : "/create"}>
        {completed ? "Explore Jobs" : "Create a Job"}
        <ArrowRight size={20} />
      </Button>
      <div className="cta-checks">
        <span>✓ Funds held in escrow</span>
        <span>✓ Reach global talent</span>
        <span>✓ Secure & transparent</span>
      </div>
    </section>
  );
}
// Picks a card icon from the job's published skills; falls back to code.
const SKILL_ICONS = [
  [/react|vue|frontend|next/i, Atom],
  [/ui|ux|figma|design/i, Palette],
  [/solidity|audit|security|smart contract/i, ShieldCheck],
  [/telegram|discord/i, Send],
  [/bot|ai|python/i, Bot],
  [/chart|analytics|data/i, BarChart3],
  [/mobile|ios|android/i, Smartphone],
  [/node|api|backend|server/i, Server],
  [/portfolio|website|landing|web3/i, Globe],
];
export function JobIcon({ job, size = 28 }) {
  const text = `${job.skills.join(" ")} ${job.title}`;
  const Icon = SKILL_ICONS.find(([test]) => test.test(text))?.[1] || Code2;
  return (
    <span className="job-icon">
      <Icon size={size} />
    </span>
  );
}
export function JobCard({ job }) {
  const remaining = daysLeft(job.deadline);
  return (
    <article className="card job-card">
      <div className="flex justify-between items-start">
        <JobIcon job={job} />
        <JobStatusBadge status={job.status} />
      </div>
      <h2>
        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
      </h2>
      <p className="job-description">{job.description}</p>
      <div className="job-price">
        <span className="eth-symbol">♦</span>
        <div>
          <ETHAmount value={job.budget} />
          <small>Fixed price</small>
        </div>
      </div>
      <div className="job-meta">
        <span>
          <Calendar size={15} />
          {remaining > 0 ? `${remaining} days left` : "Deadline passed"}
        </span>
        <span>
          <Users size={15} />
          {job.count} applications
        </span>
      </div>
      <div className="tags">
        {job.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <Button secondary to={`/jobs/${job.id}`} className="full">
        View Job
        <ArrowRight size={17} />
      </Button>
    </article>
  );
}
const STAGES = [
  ["Job Created", "JobCreated", "Project posted and budget recorded."],
  [
    "Freelancer Selected",
    "FreelancerSelected",
    "Freelancer chosen at the agreed price.",
  ],
  ["Escrow Funded", "EscrowFunded", "ETH locked in the smart contract."],
  ["Work In Progress", "WorkStarted", "Freelancer is working on the project."],
  ["Work Submitted", "WorkSubmitted", "Deliverable submitted for review."],
  [
    "Client Review",
    "PaymentReleased",
    "Client reviews the work before release.",
  ],
  [
    "Payment Released",
    "PaymentReleased",
    "Funds released after client approval.",
  ],
];
export function ProjectTimeline({ job, detailed = false }) {
  const events = useResource(() => readEvents(job.id), [job.id]).data || [];
  const current = [0, 1, 2, 3, 5, 6, -1][job.status];
  const finished = job.status === 5;
  return (
    <SectionCard
      title="Project Timeline"
      subtitle={
        finished
          ? "All milestones completed successfully."
          : "Track the progress of your project from start to finish."
      }
    >
      <ol className={`timeline ${detailed ? "detailed" : ""}`}>
        {STAGES.map(([name, eventName, note], index) => {
          const complete = job.status !== 6 && (index < current || finished);
          const event = complete && events.find((e) => e.name === eventName);
          return (
            <li
              key={name}
              className={`${complete ? "done" : ""} ${index === current ? "current" : ""}`}
            >
              <span className="timeline-dot">
                {complete ? <Check size={16} /> : index + 1}
              </span>
              <div>
                <strong>{name}</strong>
                <small>
                  {event
                    ? dateTime(event.timestamp)
                    : complete
                      ? "Confirmed on-chain"
                      : index === current
                        ? "Current stage"
                        : "Waiting"}
                </small>
              </div>
              {detailed && <p className="timeline-note">{note}</p>}
              {(finished ? complete : index === current) && (
                <span className="tiny-badge">
                  {finished ? "Completed" : "Current"}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {job.status === 6 && (
        <p className="notice">This job was cancelled before funding.</p>
      )}
    </SectionCard>
  );
}
export function EscrowCard({ job, children }) {
  const funded = [2, 3, 4].includes(job.status);
  return (
    <SectionCard
      className="escrow-card"
      title="PROJECT ESCROW"
      icon={LockKeyhole}
    >
      <p className="muted">
        Funds remain locked until the client approves the submitted work.
      </p>
      <Row label="Budget" icon={Diamond}>
        <ETHAmount value={job.budget} />
      </Row>
      <Row label="Escrow" icon={Database}>
        <span className={`badge ${funded ? "status-2" : "status-1"}`}>
          {job.status === 5
            ? "Payment released"
            : funded
              ? "Locked on-chain"
              : "Not funded"}
        </span>
      </Row>
      <Row label="Status" icon={CircleDot}>
        <JobStatusBadge status={job.status} />
      </Row>
      <Row label="Client" icon={User}>
        <WalletAddress value={job.client} />
      </Row>
      <Row label="Created" icon={Calendar}>
        {date(job.createdAt)}
      </Row>
      {children}
      <p className="secure-note">
        <ShieldCheck size={23} />
        Payment is released only after human review and client approval.
      </p>
    </SectionCard>
  );
}
export function ConfirmationModal({
  title,
  children,
  confirm,
  onConfirm,
  onClose,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
    >
      <button
        className="icon-button modal-close"
        aria-label="Close dialog"
        onClick={onClose}
      >
        <X />
      </button>
      <IconBox lime icon={Wallet} />
      <h2 id="modal-title">{title}</h2>
      <div className="modal-content">{children}</div>
      <div className="modal-actions">
        <Button secondary onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>{confirm}</Button>
      </div>
    </dialog>
  );
}
export function TransactionStatus() {
  const { transaction: tx, setTransaction, busy } = useApp();
  if (!tx) return null;
  const title = {
    waiting: "Confirm transaction in your wallet",
    submitted: "Transaction submitted",
    confirming: "Waiting for Sepolia confirmation…",
    success: "Transaction confirmed",
    failure: "Transaction failed",
  }[tx.phase];
  return (
    <aside className={`transaction-status ${tx.phase}`} aria-live="polite">
      <div className="flex items-center gap-3">
        {busy ? (
          <LoaderCircle className="spin" size={23} />
        ) : tx.phase === "success" ? (
          <Check />
        ) : (
          <CircleAlert />
        )}
        <div>
          <strong>{title}</strong>
          <p>{tx.label}</p>
        </div>
        {!busy && (
          <button
            className="icon-button"
            aria-label="Dismiss transaction"
            onClick={() => setTransaction(null)}
          >
            <X size={18} />
          </button>
        )}
      </div>
      {tx.hash && (
        <ExplorerLink value={tx.hash}>View on Sepolia Explorer</ExplorerLink>
      )}
      {tx.error && (
        <details open>
          <summary>Error details</summary>
          <p>{tx.error}</p>
        </details>
      )}
    </aside>
  );
}
export function GlobalNotices() {
  const app = useApp();
  return (
    <>
      {app.wrongNetwork && (
        <div className="network-warning" role="alert">
          <CircleAlert />
          <span>
            <strong>Wrong Network</strong> · This application runs on Ethereum
            Sepolia.
          </span>
          <Button onClick={app.switchNetwork}>Switch to Sepolia</Button>
        </div>
      )}
      {app.walletError && (
        <div className="network-warning" role="alert">
          <span>{app.walletError}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => app.setWalletError("")}
          >
            <X />
          </button>
        </div>
      )}
    </>
  );
}
export function ResourceLink({ value, children }) {
  const url = safeURL(value);
  return url ? (
    <a className="external wrap" href={url} target="_blank" rel="noreferrer">
      {children || value}
      <ExternalLink size={16} />
    </a>
  ) : (
    <span className="wrap">{value || "No link provided"}</span>
  );
}
export {
  ArrowRight,
  ArrowUpRight,
  Wallet,
  LockKeyhole,
  ShieldCheck,
  Eye,
  Users,
  FileText,
  Search,
  Calendar,
  Code2,
  Check,
  CircleAlert,
  Clock,
  Diamond,
};
