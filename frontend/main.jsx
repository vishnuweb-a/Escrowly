import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/500.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "@fontsource/nunito-sans/800.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/caveat/500.css";
import "./styles.css";
import { AppProvider } from "./hooks";
import {
  Navbar,
  Footer,
  GlobalNotices,
  TransactionStatus,
  EmptyState,
} from "./components";
import { Explore, Help } from "./pages/Marketplace";
import { Home, LandingNav, LandingFooter } from "./pages/Landing";
import { CreateJob, JobForm } from "./pages/Forms";
import { ProjectPage } from "./pages/Project";
import { Dashboard, Transactions } from "./pages/Workspace";
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
/* The landing page carries its own dark navbar and expanded footer. */
function SiteHeader() {
  return useLocation().pathname === "/" ? <LandingNav /> : <Navbar />;
}
function SiteFooter() {
  return useLocation().pathname === "/" ? <LandingFooter /> : <Footer />;
}
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="container page-body">
        <h1>Something went wrong.</h1>
        <p>Please reload the page to reconnect to your project.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <ScrollToTop />
          <a href="#content" className="skip-link">
            Skip to content
          </a>
          <SiteHeader />
          <GlobalNotices />
          <div id="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route
                path="/jobs"
                element={<Navigate to="/explore" replace />}
              />
              <Route path="/create" element={<CreateJob />} />
              <Route
                path="/create-job"
                element={<Navigate to="/create" replace />}
              />
              <Route path="/jobs/:id" element={<ProjectPage />} />
              <Route
                path="/jobs/:id/apply"
                element={<JobForm mode="apply" />}
              />
              <Route
                path="/jobs/:id/applications"
                element={<ProjectPage view="applications" />}
              />
              <Route
                path="/jobs/:id/fund"
                element={<ProjectPage view="fund" />}
              />
              <Route
                path="/jobs/:id/project"
                element={<ProjectPage view="project" />}
              />
              <Route
                path="/jobs/:id/submit"
                element={<JobForm mode="submit" />}
              />
              <Route
                path="/jobs/:id/review"
                element={<ProjectPage view="review" />}
              />
              <Route
                path="/jobs/:id/completed"
                element={<ProjectPage view="completed" />}
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/profile" element={<Dashboard />} />
              <Route path="/help" element={<Help />} />
              <Route
                path="*"
                element={
                  <EmptyState
                    title="Page not found"
                    description="This page may have moved. Explore the marketplace to continue."
                    action="Explore Jobs"
                    to="/explore"
                  />
                }
              />
            </Routes>
          </div>
          <SiteFooter />
          <TransactionStatus />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
createRoot(document.getElementById("root")).render(<App />);
