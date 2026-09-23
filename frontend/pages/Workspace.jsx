import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp, useResource } from "../hooks";
import { readJobs, readApplications, readEvents } from "../lib/contract";
import { EVENTS, same, date, eth } from "../lib/model";
import {
  PageHeader,
  SectionCard,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  Button,
  Row,
  JobStatusBadge,
  WalletAddress,
  TransactionHash,
  ETHAmount,
  NetworkBadge,
  CallToAction,
  FileText,
  LockKeyhole,
  Users,
  Check,
  Wallet,
} from "../components";
export function EventList({ jobId, account, filter = "all", limit }) {
  const state = useResource(() => readEvents(jobId), [jobId]);
  if (state.loading)
    return (
      <div role="status" className="skeleton event-skeleton">
        Reading confirmed events…
      </div>
    );
  if (state.error) return <ErrorState error={state.error} />;
  const events = state.data.filter(
    (e) =>
      (!account ||
        Object.values(e.args).some(
          (v) => typeof v === "string" && same(v, account),
        )) &&
      (filter === "all" || e.name === filter),
  );
  if (!events.length)
    return (
      <EmptyState
        title="No transactions yet."
        description="Confirmed escrow activity will appear here."
      />
    );
  return (
    <ol className="event-list">
      {events.slice(0, limit).map((e) => (
        <li key={`${e.hash}-${e.index}`}>
          <span className="event-dot">
            <Check size={15} />
          </span>
          <div className="event-details">
            <strong>{EVENTS[e.name] || e.name}</strong>
            <small>
              {date(e.timestamp)} ·{" "}
              {new Date(e.timestamp * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · <Link to={`/jobs/${e.jobId}`}>Project #{e.jobId}</Link>
            </small>
            <TransactionHash value={e.hash} />
          </div>
          <div className="event-amount">
            {(e.args.amount ??
              e.args.budget ??
              e.args.agreedPrice ??
              e.args.proposedPrice) !== undefined && (
              <ETHAmount
                value={
                  e.args.amount ??
                  e.args.budget ??
                  e.args.agreedPrice ??
                  e.args.proposedPrice
                }
              />
            )}
            <span className="badge status-5">Confirmed</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function Transactions() {
  const app = useApp(),
    [params] = useSearchParams(),
    [filter, setFilter] = useState("all"),
    [mine, setMine] = useState(false);
  const jobId = /^\d+$/.test(params.get("job") || "")
    ? params.get("job")
    : undefined;
  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every step. Recorded on-chain. Follow your escrow activity on Ethereum Sepolia."
      >
        <div className="header-project">
          <LockKeyhole size={46} />
          <div>
            <h2>Transparent by design.</h2>
            <p>Confirmed contract events. Publicly verifiable.</p>
          </div>
        </div>
      </PageHeader>
      <main className="container page-body">
        <div className="results-heading">
          <div>
            <h2>
              {jobId ? `Project #${jobId} activity` : "Transaction History"}
            </h2>
            <p className="muted">Only confirmed blockchain events are shown.</p>
          </div>
          <div className="transaction-filters">
            <select
              aria-label="Transaction type"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All transactions</option>
              {Object.entries(EVENTS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {app.account && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={mine}
                  onChange={(e) => setMine(e.target.checked)}
                />
                My wallet
              </label>
            )}
          </div>
        </div>
        <SectionCard>
          <EventList
            jobId={jobId}
            account={mine ? app.account : null}
            filter={filter}
          />
        </SectionCard>
      </main>
    </>
  );
}
export function Dashboard() {
  const app = useApp(),
    [role, setRole] = useState(null),
    [tab, setTab] = useState("All Projects");
  const state = useResource(async () => {
    const jobs = await readJobs();
    const applications = app.account
      ? await Promise.all(
          jobs.map(async (job) => ({
            job,
            applications: await readApplications(job.id),
          })),
        )
      : [];
    return {
      jobs,
      applied: applications
        .filter((item) =>
          item.applications.some((a) => same(a.applicant, app.account)),
        )
        .map((item) => item.job),
    };
  }, [app.account]);
  const jobs = state.data?.jobs || [],
    clientJobs = jobs.filter((j) => same(j.client, app.account)),
    freelancerJobs = jobs.filter((j) => same(j.freelancer, app.account)),
    activeRole = role || (clientJobs.length ? "client" : "freelancer"),
    isClient = activeRole === "client";
  const owned = isClient ? clientJobs : freelancerJobs,
    applied = state.data?.applied || [],
    active = owned.filter((j) => [1, 2, 3, 4].includes(j.status)),
    completed = owned.filter((j) => j.status === 5),
    total = (entries) => entries.reduce((sum, j) => sum + j.budget, 0n),
    locked = owned.reduce((sum, j) => sum + j.escrowAmount, 0n);
  const tabs = isClient
    ? [
        "All Projects",
        "Open Jobs",
        "Active Projects",
        "Awaiting Review",
        "Completed",
      ]
    : [
        "All Projects",
        "My Applications",
        "Selected Projects",
        "In Progress",
        "Awaiting Review",
        "Completed",
      ];
  const shown = (tab === "My Applications" ? applied : owned).filter((j) =>
    tab === "Open Jobs"
      ? j.status === 0
      : tab === "Active Projects"
        ? [1, 2, 3, 4].includes(j.status)
        : tab === "Selected Projects"
          ? [1, 2].includes(j.status)
          : tab === "In Progress"
            ? j.status === 3
            : tab === "Awaiting Review"
              ? j.status === 4
              : tab === "Completed"
                ? j.status === 5
                : true,
  );
  return (
    <>
      <PageHeader
        title="Your work. In one place."
        description="Track projects, manage escrow, and keep your next step in sight."
      >
        <div className="header-project">
          <Wallet size={38} />
          <div>
            <small>CONNECTED WALLET</small>
            <h2>
              {app.account ? (
                <WalletAddress value={app.account} />
              ) : (
                "Connect to get started"
              )}
            </h2>
            <NetworkBadge />
          </div>
        </div>
      </PageHeader>
      <main className="container page-body">
        {!app.account ? (
          <SectionCard>
            <EmptyState
              title="Your dashboard starts with your wallet."
              description="Connect to see the projects and applications associated with your address."
            />
            <div className="center">
              <Button onClick={app.connect}>Connect Wallet</Button>
            </div>
          </SectionCard>
        ) : state.loading ? (
          <LoadingSkeleton />
        ) : state.error ? (
          <ErrorState error={state.error} />
        ) : (
          <>
            <div className="results-heading">
              <div>
                <h2>{isClient ? "Client" : "Freelancer"} Dashboard</h2>
                <p className="muted">
                  Your activity, read directly from the escrow contract.
                </p>
              </div>
              <div className="segmented">
                <button
                  className={isClient ? "selected" : ""}
                  aria-pressed={isClient}
                  onClick={() => {
                    setRole("client");
                    setTab("All Projects");
                  }}
                >
                  Client
                </button>
                <button
                  className={!isClient ? "selected" : ""}
                  aria-pressed={!isClient}
                  onClick={() => {
                    setRole("freelancer");
                    setTab("All Projects");
                  }}
                >
                  Freelancer
                </button>
              </div>
            </div>
            <div className="dashboard-stats">
              {(isClient
                ? [
                    [FileText, "Active Projects", active.length],
                    [LockKeyhole, "ETH in Escrow", `${eth(locked)} ETH`],
                    [Wallet, "Total Paid", `${eth(total(completed))} ETH`],
                    [Check, "Completed", completed.length],
                  ]
                : [
                    [FileText, "Active Projects", active.length],
                    [
                      Users,
                      "Pending Applications",
                      applied.filter((j) => j.status === 0).length,
                    ],
                    [
                      Wallet,
                      "Awaiting Payment",
                      `${eth(total(owned.filter((j) => j.status === 4)))} ETH`,
                    ],
                    [Check, "Completed", completed.length],
                  ]
              ).map(([Icon, label, value]) => (
                <SectionCard key={label}>
                  <span className="stat-icon">
                    <Icon size={23} />
                  </span>
                  <small>{label}</small>
                  <strong className="stat-value">{value}</strong>
                </SectionCard>
              ))}
            </div>
            <div className="tabs" role="group" aria-label="Filter projects">
              {tabs.map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <SectionCard>
              {shown.length ? (
                <div className="project-table">
                  <div className="table-head">
                    <span>PROJECT</span>
                    <span>BUDGET</span>
                    <span>DEADLINE</span>
                    <span>STATUS</span>
                    <span />
                  </div>
                  {shown.map((job) => (
                    <div className="table-row" key={String(job.id)}>
                      <div>
                        <Link to={`/jobs/${job.id}`}>
                          <strong>{job.title}</strong>
                        </Link>
                        <small>
                          Project #{String(job.id)} · {job.count} applications
                        </small>
                      </div>
                      <ETHAmount value={job.budget} />
                      <span>{date(job.deadline)}</span>
                      <JobStatusBadge status={job.status} />
                      <Button
                        secondary
                        to={`/jobs/${job.id}${job.status === 1 && isClient ? "/fund" : job.status > 1 ? "/project" : ""}`}
                      >
                        View Project →
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No projects here yet."
                  description={
                    isClient
                      ? "Create a job to start working with a freelancer."
                      : "Explore jobs and send your first proposal."
                  }
                  action={isClient ? "Create Job" : "Explore Jobs"}
                  to={isClient ? "/create" : "/explore"}
                />
              )}
            </SectionCard>
            <div className="dashboard-bottom">
              <SectionCard title="Wallet & Network">
                <Row label="Wallet">
                  <WalletAddress value={app.account} />
                </Row>
                <Row label="Network">
                  <NetworkBadge />
                </Row>
                <Row label="Transactions">
                  <Link className="text-link" to="/transactions">
                    View transaction history ↗
                  </Link>
                </Row>
              </SectionCard>
              <SectionCard title="Your next step">
                <p className="muted">
                  {isClient
                    ? "Review applications, fund selected projects, or approve submitted work from each project page."
                    : "Track your applications and open a funded project to start work. Submit deliverables when your project is ready for review."}
                </p>
              </SectionCard>
            </div>
          </>
        )}
        <CallToAction />
      </main>
    </>
  );
}
