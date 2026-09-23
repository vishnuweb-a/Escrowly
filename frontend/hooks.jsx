import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { BrowserProvider, Contract } from "ethers";
import { setup, abi } from "./lib/contract";
import { humanError } from "./lib/model";
const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
export function AppProvider({ children }) {
  const [config, setConfig] = useState(null),
    [account, setAccount] = useState(null),
    [chain, setChain] = useState(null),
    [walletError, setWalletError] = useState(""),
    [connecting, setConnecting] = useState(false),
    [revision, setRevision] = useState(0),
    [transaction, setTransaction] = useState(null);
  const inFlight = useRef(false);
  useEffect(() => {
    setup()
      .then((s) => setConfig(s.config))
      .catch((e) => setWalletError(humanError(e)));
  }, []);
  useEffect(() => {
    const wallet = window.ethereum;
    if (!wallet) return;
    const accounts = (values) => setAccount(values[0] || null);
    const chains = (value) => setChain(Number(value));
    if (sessionStorage.getItem("escrowly-disconnected") !== "true")
      wallet
        .request({ method: "eth_accounts" })
        .then(accounts)
        .catch(() => {});
    wallet
      .request({ method: "eth_chainId" })
      .then(chains)
      .catch(() => {});
    wallet.on?.("accountsChanged", accounts);
    wallet.on?.("chainChanged", chains);
    const disconnect = () => {
      setAccount(null);
      setChain(null);
    };
    wallet.on?.("disconnect", disconnect);
    return () => {
      wallet.removeListener?.("accountsChanged", accounts);
      wallet.removeListener?.("chainChanged", chains);
      wallet.removeListener?.("disconnect", disconnect);
    };
  }, []);
  const connect = async () => {
    setConnecting(true);
    setWalletError("");
    try {
      if (!window.ethereum)
        throw new Error(
          "Install an Ethereum wallet such as MetaMask or Rabby, then refresh this page.",
        );
      const values = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(values[0] || null);
      setChain(
        Number(await window.ethereum.request({ method: "eth_chainId" })),
      );
      sessionStorage.removeItem("escrowly-disconnected");
    } catch (e) {
      setWalletError(humanError(e));
    } finally {
      setConnecting(false);
    }
  };
  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + config.chainId.toString(16) }],
      });
      setWalletError("");
    } catch (e) {
      setWalletError(humanError(e));
    }
  };
  const disconnect = () => {
    setAccount(null);
    sessionStorage.setItem("escrowly-disconnected", "true");
  };
  const refresh = useCallback(() => setRevision((r) => r + 1), []);
  const wrongNetwork = !!account && !!config && chain !== config.chainId;
  const write = async (label, execute, after) => {
    if (inFlight.current) return;
    inFlight.current = true;
    let hash;
    try {
      if (!account) throw new Error("Connect your wallet to continue.");
      if (wrongNetwork || !config)
        throw new Error("Switch to Ethereum Sepolia before continuing.");
      setTransaction({ phase: "waiting", label });
      const provider = new BrowserProvider(window.ethereum);
      if (Number((await provider.getNetwork()).chainId) !== config.chainId)
        throw new Error("Switch to Ethereum Sepolia before continuing.");
      const signer = await provider.getSigner(account);
      const contract = new Contract(config.address, abi, signer);
      const tx = await execute(contract, signer);
      hash = tx.hash;
      setTransaction({ phase: "submitted", label, hash: tx.hash });
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTransaction({ phase: "confirming", label, hash: tx.hash });
      let receipt;
      try {
        receipt = await tx.wait();
      } catch (e) {
        if (
          e.code === "TRANSACTION_REPLACED" &&
          !e.cancelled &&
          e.receipt?.status === 1
        )
          receipt = e.receipt;
        else throw e;
      }
      if (!receipt || receipt.status !== 1)
        throw new Error("The transaction was not confirmed successfully.");
      setTransaction({ phase: "success", label, hash: receipt.hash });
      refresh();
      if (after) {
        try {
          await after(receipt, signer);
        } catch (e) {
          setWalletError(humanError(e));
        }
      }
      refresh();
      return receipt;
    } catch (e) {
      setTransaction({
        hash,
        phase: "failure",
        label,
        error: humanError(e),
      });
    } finally {
      inFlight.current = false;
    }
  };
  const busy = ["waiting", "submitted", "confirming"].includes(
    transaction?.phase,
  );
  return (
    <AppContext.Provider
      value={{
        config,
        account,
        chain,
        walletError,
        setWalletError,
        connecting,
        connect,
        disconnect,
        wrongNetwork,
        switchNetwork,
        revision,
        refresh,
        write,
        transaction,
        setTransaction,
        busy,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useResource(loader, dependencies = []) {
  const { revision } = useApp();
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: "" });
    loader()
      .then((data) => active && setState({ data, loading: false, error: "" }))
      .catch(
        (e) =>
          active &&
          setState({ data: null, loading: false, error: humanError(e) }),
      );
    return () => {
      active = false;
    }; // Dependencies describe the loader's resource identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision]);
  return state;
}
