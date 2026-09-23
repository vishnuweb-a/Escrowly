import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CodeXml,
  Eye,
  FilePlus2,
  FileText,
  Laptop,
  LockKeyhole,
  Megaphone,
  Menu,
  Palette,
  ShieldHalf,
  Star,
  UserPen,
  Users,
  X,
} from "lucide-react";
import { useApp } from "../hooks";
import { WalletConnectButton } from "../components";

const NAV_LINKS = [
  ["#how-it-works", "How it Works"],
  ["#use-cases", "Use Cases"],
  ["#features", "Features"],
  ["/explore", "Explore Jobs"],
  ["#about", "About"],
];

const STEPS = [
  [FilePlus2, "Create Job", "Post your project with budget and deadline."],
  [Users, "Receive Applications", "Freelancers apply with proposals."],
  [UserPen, "Select Freelancer", "Choose the best fit for your project."],
  [LockKeyhole, "Fund Escrow", "Lock ETH in smart contract."],
  [Laptop, "Work & Submit", "Freelancer delivers and submits work."],
  [CircleCheck, "Approve & Pay", "Review and approve to release payment."],
];

const USE_CASES = [
  [CodeXml, "Development", "Web apps, smart contracts, bots and more."],
  [Palette, "Design", "UI/UX, branding, illustrations."],
  [FileText, "Writing", "Technical content, blogs, documentation."],
  [Megaphone, "Marketing", "Growth, social media, community support."],
];

const TESTIMONIALS = [
  {
    quote:
      "Raven made hiring so much safer. The escrow gives me complete confidence.",
    name: "Arjun Mehta",
    role: "Founder, BuildStack",
  },
  {
    quote:
      "As a freelancer, I finally feel secure. No more payment chases. Just build and get paid.",
    name: "Neha Verma",
    role: "Freelance Developer",
  },
  {
    quote:
      "Clean UI, smooth flow, and actually works. Great product for the Web3 community.",
    name: "Karan Singh",
    role: "Product Designer",
  },
];

const FOOTER_COLUMNS = [
  [
    "Product",
    [
      ["Explore Jobs", "/explore"],
      ["Create a Job", "/create"],
      ["How It Works", "#how-it-works"],
      ["Features", "#features"],
    ],
  ],
  ["Company", [["About", "#about"], ["Blog"], ["Careers"], ["Contact"]]],
  [
    "Resources",
    [
      ["Help Center", "/help"],
      ["Security"],
      ["Terms of Use"],
      ["Privacy Policy"],
    ],
  ],
];

const SOCIALS = [
  [
    "Twitter",
    "M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417 9.867 9.867 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59z",
  ],
  [
    "GitHub",
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  ],
  [
    "Discord",
    "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
  ],
  [
    "LinkedIn",
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  ],
];

const shell = "mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10";
const eyebrow =
  "text-[11px] font-bold uppercase tracking-[0.2em] sm:text-[12px]";
const sectionHeading =
  "font-extrabold tracking-[-0.025em] text-[32px] leading-[1.12] sm:text-[40px] lg:text-[44px]";

/* Internal routes use <Link>; in-page anchors use <a>; unrouted items render as text. */
function SmartLink({ to, className, children, ...props }) {
  if (!to) return <span className={className}>{children}</span>;
  return to.startsWith("#") ? (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ) : (
    <Link to={to} className={className} {...props}>
      {children}
    </Link>
  );
}

function PillButton({ to, dark = false, outline = false, children }) {
  const tone = outline
    ? dark
      ? "border border-white/70 text-white hover:bg-white/10"
      : "border border-night text-night hover:bg-zinc-100"
    : "bg-raven text-night hover:bg-[#cfea45]";
  return (
    <Link
      to={to}
      className={`inline-flex h-[54px] items-center justify-center gap-3 rounded-full px-8 text-[16px] font-bold transition-colors sm:h-[58px] sm:min-w-[210px] ${tone}`}
    >
      {children}
    </Link>
  );
}

function NetworkPill({ className = "" }) {
  const { wrongNetwork } = useApp();
  return (
    <span
      className={`inline-flex items-center gap-2.5 whitespace-nowrap ${className}`}
    >
      <i
        className={`size-2.5 rounded-full ${wrongNetwork ? "bg-orange-400" : "bg-emerald-500"}`}
      />
      {wrongNetwork ? "Wrong network" : "Sepolia Testnet"}
    </span>
  );
}

function RavenLogo({ light = false, tagline = false }) {
  return (
    <Link
      to="/"
      aria-label="Raven home"
      className={`inline-flex shrink-0 items-center gap-2.5 ${light ? "text-white" : "text-night"}`}
    >
      <img
        src={light ? "/logo-mark-light.png" : "/logo-mark-dark.png"}
        alt=""
        aria-hidden="true"
        className={`-scale-x-100 object-contain ${tagline ? "h-[76px] w-[64px]" : "h-[46px] w-[39px]"}`}
      />
      <span className="flex flex-col">
        <span
          className={`font-serif font-semibold tracking-[-0.02em] ${tagline ? "text-[34px] leading-none" : "text-[26px] leading-none"}`}
        >
          Raven
        </span>
        {tagline && (
          <span className="mt-2 text-[15px] text-zinc-500">
            Work. Build. Belong.
          </span>
        )}
      </span>
    </Link>
  );
}

export function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-30 bg-night font-landing text-white">
      <div
        className={`${shell} flex h-[88px] items-center gap-3 sm:gap-6 lg:h-[100px]`}
      >
        <RavenLogo light />
        <nav
          aria-label="Main navigation"
          className="ml-auto mr-auto hidden items-center gap-11 text-[14px] font-semibold lg:flex xl:gap-14"
        >
          {NAV_LINKS.map(([to, label]) => (
            <SmartLink
              key={label}
              to={to}
              className="text-white/90 transition-colors hover:text-raven"
            >
              {label}
            </SmartLink>
          ))}
        </nav>
        <div className="landing-wallet ml-auto flex items-center gap-2 lg:ml-0">
          <WalletConnectButton />
          <button
            className="inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full border-t border-white/10 bg-night px-5 pb-6 pt-2 sm:px-8 lg:hidden"
        >
          {NAV_LINKS.map(([to, label]) => (
            <SmartLink
              key={label}
              to={to}
              onClick={() => setOpen(false)}
              className="block border-b border-white/10 py-4 text-[16px] font-semibold"
            >
              {label}
            </SmartLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-night font-landing text-white">
      <div
        className={`${shell} grid items-center gap-y-10 pb-12 pt-10 lg:min-h-[740px] lg:grid-cols-[1.18fr_1fr] lg:pb-16 lg:pt-6`}
      >
        <div>
          <p className={`${eyebrow} text-white/85`}>
            Decentralized Freelance Escrow
          </p>
          <h1 className="mt-5 whitespace-nowrap font-serif text-[clamp(34px,10.5vw,46px)] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[64px] lg:text-[78px]">
            Freelance work.
            <br />
            <span className="text-raven">Secured</span> by code.
          </h1>
          <p className="mt-6 max-w-[480px] text-[17px] leading-[1.75] text-white/90 sm:text-[19px]">
            Raven connects clients and freelancers through transparent
            smart-contract escrow. Work with confidence. Get paid with trust.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <PillButton to="/explore">
              Explore Jobs <ArrowRight size={20} strokeWidth={2.4} />
            </PillButton>
            <PillButton to="/create" dark outline>
              Create a Job
            </PillButton>
          </div>
          <dl className="mt-14 grid grid-cols-3 lg:mt-[72px] lg:flex">
            {[
              ["1,200+", "Jobs Posted"],
              ["850+", "Freelancers"],
              ["2.8K+", "Transactions (Testnet)"],
            ].map(([value, label], i) => (
              <div
                key={label}
                className={`flex flex-col-reverse ${i ? "border-l border-white/20 pl-4 sm:pl-7 lg:pl-14" : ""} pr-4 sm:pr-7 lg:pr-14`}
              >
                <dt className="mt-1.5 text-[13px] text-white/85 sm:text-[16px]">
                  {label}
                </dt>
                <dd className="text-[24px] font-extrabold tracking-[-0.02em] sm:text-[33px]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroArt />
      </div>
    </section>
  );
}

function HeroArt() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[42/56] w-full max-w-[420px] lg:mr-2 lg:max-w-[440px] lg:self-stretch lg:aspect-auto"
    >
      <div className="absolute right-[3%] top-0 aspect-square w-[92%] rounded-full bg-raven lg:top-[-2px]" />
      <img
        src="/raven-hero.png"
        alt=""
        width="540"
        height="640"
        className="absolute left-[8%] top-[17%] w-[76%] -scale-x-100 drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
      />
      <div className="absolute bottom-[13%] right-[6%] rotate-[-12deg] font-hand text-[30px] leading-[0.95] text-white/95 sm:text-[36px] lg:bottom-[15%]">
        <span className="block">Work</span>
        <span className="block pl-1">Build</span>
        <span className="block pl-2">Belong</span>
        <svg
          viewBox="0 0 160 20"
          className="-ml-2 mt-1 w-[150px] text-raven"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M3 16C45 10 100 5 157 3" />
          <path d="M20 18c40-4 80-8 118-10" strokeWidth="1.6" />
        </svg>
      </div>
      <NetworkPill className="absolute bottom-0 right-0 rounded-full bg-white/[0.07] px-4 py-2 text-[14px] font-semibold text-white" />
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 bg-white">
      <div className={`${shell} pb-16 pt-16 lg:pb-[76px] lg:pt-[68px]`}>
        <p className={`${eyebrow} text-night`}>How it Works</p>
        <h2 className={`${sectionHeading} mt-4 text-night`}>
          A Simple, Secure Process.
        </h2>
        <p className="mt-3 text-[17px] text-zinc-500">
          From posting a job to receiving payment, everything happens
          transparently on-chain.
        </p>
        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-6 lg:gap-x-0">
          {STEPS.map(([Icon, title, text], i) => (
            <li key={title} className="flex gap-5 sm:block">
              <div className="relative flex items-center">
                <span className="flex size-[72px] shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-night lg:size-[108px] lg:rounded-[20px]">
                  <Icon className="size-8 lg:size-[42px]" strokeWidth={1.7} />
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-5 hidden h-0 flex-1 border-t-2 border-dashed border-zinc-300 lg:block" />
                )}
              </div>
              <div className="lg:pr-7">
                <h3 className="mt-1 text-[16px] font-bold text-night sm:mt-5 lg:mt-6">
                  {i + 1}. {title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.65] text-zinc-500">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WhyRaven() {
  return (
    <section id="features" className="scroll-mt-6 bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-5 lg:px-2">
        <div className="rounded-3xl bg-[#f1f2f3] px-5 py-12 sm:px-8 lg:px-11 lg:pb-11 lg:pt-14">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <p className={`${eyebrow} text-night`}>Why Raven?</p>
              <h2 className={`${sectionHeading} mt-4 text-night`}>
                Built For A Fairer
                <br />
                Freelance Economy.
              </h2>
            </div>
            <p className="max-w-[560px] text-[17px] leading-[1.75] text-zinc-500 lg:mt-8 lg:text-[18px]">
              Raven removes the risk, builds trust, and gives freelancers and
              clients a better way to work together using blockchain technology.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-11 lg:gap-7">
            <article className="flex min-h-[250px] flex-col rounded-[22px] bg-night p-8 text-white lg:min-h-[290px]">
              <LockKeyhole className="mt-2 size-8 text-raven" strokeWidth={2} />
              <h3 className="mt-7 text-[26px] font-bold leading-[1.22] tracking-[-0.02em]">
                Funds Locked
                <br />
                On-Chain
              </h3>
              <p className="mt-4 text-[16px] leading-[1.7] text-white/85">
                Payments remain in escrow until work is approved.
              </p>
            </article>
            {[
              [
                Eye,
                ["Transparent", "Workflow"],
                "Every transaction can be verified on Sepolia.",
              ],
              [
                ShieldHalf,
                ["Wallet-Based", "Identity"],
                "No fake profiles. Real on-chain participants.",
              ],
            ].map(([Icon, [a, b], text]) => (
              <article
                key={a}
                className="flex min-h-[250px] flex-col rounded-[22px] bg-white p-8 lg:min-h-[290px]"
              >
                <span className="flex size-[60px] items-center justify-center rounded-xl bg-raven text-night">
                  <Icon className="size-8" strokeWidth={2.1} />
                </span>
                <h3 className="mt-6 text-[26px] font-bold leading-[1.22] tracking-[-0.02em] text-night">
                  {a}
                  <br />
                  {b}
                </h3>
                <p className="mt-4 text-[16px] leading-[1.7] text-zinc-500">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-6 bg-white">
      <div className={`${shell} pt-16 lg:pt-[72px]`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`${eyebrow} text-night`}>Use Cases</p>
            <h2 className={`${sectionHeading} mt-4 text-night`}>
              For Builders, Creators, and Businesses.
            </h2>
          </div>
          <div className="shrink-0">
            <PillButton to="/explore" outline>
              Explore Jobs <ArrowRight size={19} strokeWidth={2.4} />
            </PillButton>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-7 lg:grid-cols-4">
          {USE_CASES.map(([Icon, title, text]) => (
            <Link
              key={title}
              to="/explore"
              className="group rounded-2xl border border-zinc-200/70 bg-[#f4f5f6] p-6 transition-colors hover:border-zinc-300 lg:min-h-[236px] lg:p-7"
            >
              <span className="flex size-[72px] items-center justify-center rounded-2xl bg-raven text-night lg:size-[80px]">
                <Icon className="size-9" strokeWidth={2.1} />
              </span>
              <h3 className="mt-6 text-[20px] font-bold text-night">{title}</h3>
              <p className="mt-1.5 max-w-[230px] text-[16px] leading-[1.6] text-zinc-500">
                {text}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Community() {
  return (
    <section id="about" className="scroll-mt-6 bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-3 pt-16 sm:px-5 lg:px-6 lg:pt-16">
        <div className="grid gap-8 rounded-[28px] bg-raven px-6 py-10 text-night sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-12">
          <div>
            <p className={eyebrow}>Trusted by a growing community</p>
            <h2 className={`${sectionHeading} mt-3`}>Work Without Worries.</h2>
            <p className="mt-3 max-w-[520px] text-[17px] leading-[1.65] lg:text-[18px]">
              Join hundreds of clients and freelancers already building on
              Raven.
            </p>
          </div>
          <dl className="flex">
            {[
              ["98%", "Successful Projects"],
              ["4.9/5", "User Satisfaction"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="flex flex-col-reverse border-l border-night/25 pl-8 pr-6 first:border-l-0 first:pl-0 sm:pl-14 sm:pr-10 lg:first:border-l lg:first:pl-14"
              >
                <dt className="mt-1 text-[15px] font-medium lg:text-[16px]">
                  {label}
                </dt>
                <dd className="text-[34px] font-extrabold tracking-[-0.02em] lg:text-[40px]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const track = useRef(null);
  const scroll = (dir) =>
    track.current?.scrollBy({
      left: dir * track.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  return (
    <section className="bg-white">
      <div className={`${shell} pt-16 lg:pt-[76px]`}>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className={`${eyebrow} text-night`}>Testimonials</p>
            <h2 className={`${sectionHeading} mt-4 text-night`}>
              What Our Users Say.
            </h2>
          </div>
          <div className="flex gap-3">
            {[
              [-1, ArrowLeft, "Previous testimonial"],
              [1, ArrowRight, "Next testimonial"],
            ].map(([dir, Icon, label]) => (
              <button
                key={label}
                aria-label={label}
                onClick={() => scroll(dir)}
                className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-night transition-colors hover:bg-zinc-200 lg:size-[60px]"
              >
                <Icon size={22} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1280px] lg:px-4">
        <div
          ref={track}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:px-8 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <figure
              key={name}
              className="flex w-[85%] shrink-0 snap-start items-start gap-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:w-[60%] lg:w-auto lg:min-h-[250px] lg:p-6"
            >
              <span className="flex size-[84px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-zinc-200 to-zinc-300 text-[26px] font-bold text-zinc-600 lg:size-[112px] lg:text-[32px]">
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div className="pt-2">
                <blockquote className="text-[15px] leading-[1.6] text-zinc-600">
                  “{quote}”
                </blockquote>
                <figcaption className="mt-4">
                  <strong className="block text-[17px] font-bold text-night">
                    {name}
                  </strong>
                  <span className="text-[14px] text-zinc-500">{role}</span>
                  <span
                    className="mt-3 flex gap-1 text-[#c8e43c]"
                    aria-label="5 out of 5 stars"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={18}
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    ))}
                  </span>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-3 pt-10 sm:px-5 lg:px-8 lg:pt-10">
        <div className="relative grid gap-8 overflow-hidden rounded-[28px] bg-night px-6 py-11 text-white sm:px-10 lg:min-h-[270px] lg:grid-cols-[1fr_auto] lg:items-center">
          <img
            src="/logo-mark-dark.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 right-[5%] hidden w-[190px] -scale-x-100 opacity-25 brightness-[2] md:block"
          />
          <div className="relative">
            <p className={`${eyebrow} text-white/85`}>Ready to get started?</p>
            <h2 className={`${sectionHeading} mt-4`}>Let’s Build Together.</h2>
            <p className="mt-3 max-w-[470px] text-[17px] leading-[1.65] text-white/85 lg:text-[18px]">
              Join Raven today and experience a new standard for freelance
              collaboration.
            </p>
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row">
            <PillButton to="/explore">
              Explore Jobs <ArrowRight size={20} strokeWidth={2.4} />
            </PillButton>
            <PillButton to="/create" dark outline>
              Create a Job
            </PillButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-white font-landing">
      <div className={`${shell} pb-8 pt-14 lg:pt-12`}>
        <div className="grid gap-12 md:grid-cols-[1fr_1.8fr]">
          <div>
            <RavenLogo tagline />
            <div className="mt-8 flex gap-6 text-night">
              {SOCIALS.map(([label, path]) => (
                <svg
                  key={label}
                  role="img"
                  aria-label={label}
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="currentColor"
                >
                  <path d={path} />
                </svg>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {FOOTER_COLUMNS.map(([title, links]) => (
              <nav key={title} aria-label={title}>
                <h3 className="text-[16px] font-bold text-night">{title}</h3>
                <ul className="mt-4 space-y-3.5">
                  {links.map(([label, to]) => (
                    <li key={label}>
                      <SmartLink
                        to={to}
                        className={`text-[15px] text-zinc-600 ${to ? "transition-colors hover:text-night" : ""}`}
                      >
                        {label}
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 text-[14px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Raven. All rights reserved.</span>
          <NetworkPill className="font-semibold text-night" />
        </div>
      </div>
    </footer>
  );
}

export function Home() {
  return (
    <main className="overflow-x-clip bg-white font-landing text-night">
      <Hero />
      <HowItWorks />
      <WhyRaven />
      <UseCases />
      <Community />
      <Testimonials />
      <FinalCta />
    </main>
  );
}
