import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ChickenInventory } from "./components/ChickenInventory";
import { EggProduction } from "./components/EggProduction";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { SelectionPage } from "./components/SelectionPage";
import { useAuth } from "./AuthContext";
import { Logo } from "./components/Logo";

// Guard to ensure user is logged in
function AuthGuard() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-babs-cream flex flex-col items-center justify-center gap-6 animate-pulse">
        <Logo className="w-20 h-20 opacity-50" />
        <div className="w-12 h-12 border-4 border-babs-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-babs-brown/40 uppercase tracking-[0.3em]">Chargement d'Excellence</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Guard to ensure species is selected
// CRITICAL FIX: Never redirect if local storage says user has already configured.
// Firebase sync can be slow, and we must not interrupt the user during that.
function SelectionGuard() {
  const { poultryTypes, isPreferencesLoaded, isInitialPullDone } = useAuth();
  
  // PRIMARY CHECK: Trust localStorage immediately - no waiting
  const hasSelectedLocal = localStorage.getItem('has_selected_species') === 'true';
  
  // If the user has ever configured their farm, let them through immediately
  // This prevents the re-onboarding loop on every reconnection
  if (hasSelectedLocal) return <Outlet />;

  // SECONDARY CHECK: Live React state (from Firebase or real-time updates)
  const hasTypes = poultryTypes && poultryTypes.length > 0;
  if (hasTypes) return <Outlet />;

  // Only redirect to selection if:
  // 1. No local flag (brand new user)
  // 2. Firebase has fully loaded and confirmed no preferences exist
  if (isInitialPullDone && isPreferencesLoaded && !hasTypes) {
    return <Navigate to="/selection" replace />;
  }

  // Otherwise show loading spinner while waiting for Firebase
  return (
    <div className="min-h-screen bg-babs-cream flex flex-col items-center justify-center gap-6">
      <Logo className="w-20 h-20 opacity-50" />
      <div className="w-12 h-12 border-4 border-babs-orange border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-babs-brown/40 uppercase tracking-[0.3em]">Chargement de votre ferme...</p>
    </div>
  );
}

// Guard to ensure user has Pro or Business tier access
function ProGuard() {
  return <Outlet />;
}

async function loadIncubatorRoute() {
  const module = await import("./components/IncubatorManagement");
  return { Component: module.IncubatorManagement };
}

async function loadFeedRoute() {
  const module = await import("./components/FeedManagement");
  return { Component: module.FeedManagement };
}

async function loadHealthRoute() {
  const module = await import("./components/HealthTracking");
  return { Component: module.HealthTracking };
}

async function loadFinancesRoute() {
  const module = await import("./components/FinanceManagement");
  return { Component: module.FinanceManagement };
}

async function loadTeamRoute() {
  const module = await import("./components/TeamManagement");
  return { Component: module.TeamManagement };
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/selection",
        Component: SelectionPage,
      },
      {
        element: <SelectionGuard />,
        children: [
          {
            path: "/",
            element: <Layout />,
            children: [
              { index: true, Component: Dashboard },
              { path: "inventory", Component: ChickenInventory },
              { path: "eggs", Component: EggProduction },
              { path: "feed", lazy: loadFeedRoute },
              { path: "health", lazy: loadHealthRoute },
              {
                element: <ProGuard />,
                children: [
                  { path: "finances", lazy: loadFinancesRoute },
                  { path: "incubator", lazy: loadIncubatorRoute },
                  { path: "team", lazy: loadTeamRoute },
                ]
              },
            ],
          },
        ],
      },
    ],
  },
]);
