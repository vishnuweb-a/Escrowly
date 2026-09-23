# Frontend implementation

## Running the application

Requires Node.js 20.19+; verified with Node 24.

```sh
npm install
npm run dev
```

For the built app, run `npm run build` followed by `npm start`. The server binds localhost on port 4173. A reverse proxy can forward to that port. `npm run preview` also includes the app API.

The application requires the Node API for RPC reads and shared project descriptions. Deploying only `dist/` to a static host is insufficient. Keep `.data/` on persistent storage and back it up. Install dev dependencies too: the current start script uses Vite's environment loader.

## Configuration

The existing root `.env` is unchanged. `SEPOLIA_RPC_URL` is read only by Node. `PRIVATE_KEY`, `APIKEY`, and the deployer `WALLET_ADDRESS` are never imported by React or used to sign app transactions. Users sign writes in their connected wallets.

The existing environment had no contract-address variable, so the app reads the contract address and deployment block from `broadcast/DeployFreelanceEscrow.s.sol/11155111/run-latest.json`. It does not confuse the deployer with the contract.

Optional overrides, without renaming existing variables:

| Variable | Purpose |
| --- | --- |
| `CONTRACT_ADDRESS` or `VITE_CONTRACT_ADDRESS` | Override the contract address |
| `VITE_CHAIN_ID` | Defaults to Sepolia |
| `VITE_EXPLORER_URL` | Defaults to the Sepolia explorer |
| `VITE_DEPLOYMENT_BLOCK` | First block for event history |
| `PORT` | Built application server port |

Never place secrets in `VITE_` variables. The product is intended for Sepolia; the browser suite uses isolated local overrides.

## Reference mapping

| Reference | Screen | Route |
| --- | --- | --- |
| `1page.png` | Landing | `/` |
| `2page.png` | Marketplace, search, filters, grid/list | `/explore` |
| `3page.png` | Open job details | `/jobs/:id` |
| `4page.png` | Create job and live summary | `/create` |
| `5page.png` | Apply for job | `/jobs/:id/apply` |
| `6page.png` | Applications and selection dialog | `/jobs/:id/applications` |
| `7page.png` | Selected freelancer and funding | `/jobs/:id/fund` |
| `8page.png` | Funded / in-progress project | `/jobs/:id/project` |
| `9page.png` | Review and release dialog | `/jobs/:id/review` |
| `10page.png` | Completion and payment | `/jobs/:id/completed` |

Additional screens: `/jobs/:id/submit`, `/dashboard` (client/freelancer views), `/transactions`, `/profile`, `/help`. `/jobs` and `/create-job` are aliases. Routes always use actual contract state: a completed URL cannot fabricate completion.

Shared UI covers wallet dropdowns, wrong network, read errors, loading, empty states, and transaction waiting/submitted/confirming/success/failure. The reference composition uses dark headers, white cards, lime actions, a consistent timeline, and responsive columns. Displayed identities and amounts come from contract data, rather than fictitious people, ratings, or transactions.

## Architecture

```text
frontend/
  components.jsx    Shared UI, wallet controls, dialogs, timeline
  hooks.jsx         Wallet state, contract writes, resource loading
  lib/abi.json      ABI extracted from existing Foundry artifact
  lib/contract.js   Reads, events, signed metadata publishing
  lib/model.js      Status mapping, role rules, formatting, safe links
  pages/            Marketplace, forms, projects, dashboards
  styles.css        Reference-based layouts and responsive rules
server/
  api.js            Read-only RPC proxy and signed project metadata
  start.js          Built app hosting and SPA fallback
tests/
  model.test.js     Permission matrix, enums, precision, safe URLs
  browser-flow.mjs  Real local-chain browser flow and screenshots
  live-read.mjs     Read-only Sepolia smoke check and secret scan
src/                Existing Solidity, unchanged
test/               Existing contract tests, unchanged
```

## Contract integration and limitations

- Creating a job stores budget and deadline; it does **not** fund escrow.
- Selecting an application sets the agreed budget to the freelancer's price. Funding sends that exact amount.
- Only the selected freelancer can start or submit work. Only the client can select, fund, approve, or cancel before funding.
- Final state appears after a successful receipt and fresh reads. Confirmed replacement transactions are handled. Events supply the transaction history, original budget, and payment hash.
- The contract has no title/description fields. The app stores them, skills, requirements, and attachment links in `.data/<chain>-<contract>/`. A free wallet signature is verified against the on-chain client before publishing. Other browsers using the same server can read those details.
- If description publishing fails after job creation, a session draft offers a retry from the project page. The confirmed job remains on-chain.
- Proposals and submissions use a JSON data URI holding the public note and reference URL. Existing plain HTTP/IPFS URIs also work. The existing contract function signatures are unchanged.
- Attachments are hosted file links, not uploads; no upload provider existed in this repository.
- Names, ratings, chat, and notifications are not available from this contract and are not fabricated.
- The contract has no refunds, disputes, revisions, or milestone payments. Deadlines do not automatically release or refund funds. Unsupported artwork controls have been omitted or replaced with accurate explanations.

Blockchain verifies funds and workflow state; the client still reviews work quality.

## Verification

```sh
npm run lint
npm test
npm run build
forge test
```

The browser suite requires Foundry's `anvil` on PATH and Chromium:

```sh
npx playwright install chromium
npm run test:browser
```

It starts Anvil on 18545 and Vite on 5180, deploys the unchanged artifact locally, and connects Chromium to unlocked local test wallets. It exercises creation, metadata publishing, application, selection, funding, role guards, starting/submitting work, approval, and exact balance changes. It also checks filtering, dropdowns, network switching, rejected writes, unauthorized metadata writes, and mobile overflow. Screenshots and results go to ignored `.verification/`.

It does not use the root private key or send transactions to Sepolia. The test wallet adapter is isolated to test code and does not ship in the application.

Optional read-only live verification, with the app running:

```sh
node tests/live-read.mjs http://127.0.0.1:5173
```

Real wallet-extension signing on Sepolia still requires a user-operated wallet.
