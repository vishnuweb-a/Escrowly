import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useApp, useResource } from "../hooks";
import { readJobs } from "../lib/contract";
import { STATUSES, eth } from "../lib/model";
import {
  PageHeader,
  TrustFeatures,
  SectionCard,
  CallToAction,
  JobCard,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  Search,
} from "../components";
export function Explore() {
  const state = useResource(readJobs),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("0"),
    [budget, setBudget] = useState("all"),
    [deadline, setDeadline] = useState("all"),
    [sort, setSort] = useState("newest"),
    [list, setList] = useState(false);
  const jobs = (state.data || [])
    .filter(
      (j) =>
        `${j.title} ${j.description} ${j.skills.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "all" || j.status === Number(status)) &&
        (budget === "all" ||
          (budget === "low"
            ? Number(eth(j.budget)) <= 0.5
            : Number(eth(j.budget)) > 0.5)) &&
        (deadline === "all" ||
          (Number(j.deadline) * 1000 > Date.now() &&
            Number(j.deadline) * 1000 <=
              Date.now() + Number(deadline) * 86400000)),
    )
    .sort((a, b) =>
      sort === "budget"
        ? Number(b.budget - a.budget)
        : sort === "deadline"
          ? Number(a.deadline - b.deadline)
          : Number(b.id - a.id),
    );
  return (
    <>
      <PageHeader
        eyebrow="TRUSTED FREELANCE ESCROW FOR A MORE OPEN WORK ECONOMY"
        title="Explore Jobs"
        description="Find projects secured by smart-contract escrow."
      >
        <div className="explore-art">
          <div className="globe-grid" />
          <div className="manifesto">
            <h2>
              Real work.
              <br />
              Real builders.
              <br />A more open economy.
            </h2>
            <span className="accent">━</span>
            <div className="eyebrow">FREELANCE × WEB3 × GLOBAL</div>
          </div>
        </div>
      </PageHeader>
      <div className="explore-trust container">
        <TrustFeatures compact />
      </div>
      <div className="filter-strip">
        <div className="container filters">
          <label className="search-field">
            <Search size={23} />
            <input
              aria-label="Search jobs"
              placeholder="Search jobs by title, skills, or keywords…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUSES.map((s, i) => (
                <option value={i} key={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Budget
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="all">All</option>
              <option value="low">≤ 0.50 ETH</option>
              <option value="high">&gt; 0.50 ETH</option>
            </select>
          </label>
          <label>
            Deadline
            <select
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            >
              <option value="all">Any time</option>
              <option value="7">Next 7 days</option>
              <option value="30">Next 30 days</option>
            </select>
          </label>
          <label>
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="budget">Highest budget</option>
              <option value="deadline">Soonest deadline</option>
            </select>
          </label>
        </div>
      </div>
      <main className="container page-body">
        <div className="results-heading">
          <div>
            <h2>
              {state.loading
                ? "Reading marketplace…"
                : `${jobs.length} jobs found`}
            </h2>
            <p className="muted">
              Explore opportunities secured by the Sepolia escrow contract.
            </p>
          </div>
          <div className="segmented">
            <button
              aria-pressed={!list}
              className={!list ? "selected" : ""}
              onClick={() => setList(false)}
            >
              <LayoutGrid size={17} />
              Grid
            </button>
            <button
              aria-pressed={list}
              className={list ? "selected" : ""}
              onClick={() => setList(true)}
            >
              <List size={18} />
              List
            </button>
          </div>
        </div>
        {state.loading ? (
          <LoadingSkeleton />
        ) : state.error ? (
          <ErrorState error={state.error} />
        ) : jobs.length ? (
          <div className={`jobs-grid ${list ? "list-view" : ""}`}>
            {jobs.map((job) => (
              <JobCard key={String(job.id)} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={state.data?.length ? "No matching jobs." : "No jobs yet."}
            description={
              state.data?.length
                ? "Try another search or adjust the filters."
                : "Be the first client to create a project."
            }
            to="/create"
            action="Create Job"
          />
        )}
        <CallToAction />
      </main>
    </>
  );
}
export function Help() {
  const { config } = useApp();
  return (
    <>
      <PageHeader
        title="Secure work. Clear steps."
        description="Understand where your project is and where your ETH goes."
      />
      <main className="container page-body help-content">
        <SectionCard title="How Escrowly works">
          <ol>
            {[
              "The client posts a budget and deadline. Creating a job does not transfer the budget.",
              "Freelancers submit a price, estimated duration in days, and proposal.",
              "The client selects a freelancer. The selected price becomes the agreed budget.",
              "The client funds the exact agreed amount into the smart contract.",
              "The selected freelancer starts work and submits a deliverable.",
              "The client reviews the work, then approves and releases the entire payment.",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </SectionCard>
        <SectionCard title="What the contract guarantees">
          <p>
            Funds are held in escrow after funding. Only the client can approve
            submitted work and release payment. The blockchain records state and
            transactions; it does not judge the quality of work.
          </p>
          <p>
            This contract has no refund, dispute, revision, or milestone payment
            function. The client can cancel only before funding. A deadline is
            informational after creation and does not automatically release or
            refund funds.
          </p>
          <p>
            All payments use test ETH on Ethereum Sepolia. Wallet gas fees apply
            to writes.
          </p>
        </SectionCard>
        <SectionCard title="Project details and privacy">
          <p>
            Titles, descriptions, skills, and attachment links are stored by
            this app, with a wallet signature verifying the client. Budget,
            deadline, roles, proposals, submissions, and status are stored
            on-chain. Proposal and submission notes are public. Attachments use
            links to files you host; this app does not upload files.
          </p>
          {config && (
            <p>
              Escrow contract:{" "}
              <a
                className="external"
                target="_blank"
                rel="noreferrer"
                href={`${config.explorer}/address/${config.address}`}
              >
                {config.address}
              </a>
            </p>
          )}
        </SectionCard>
      </main>
    </>
  );
}
