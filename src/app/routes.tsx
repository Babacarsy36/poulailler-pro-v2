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
function SelectionGuard() {
  const { poultryTypes, isPreferencesLoaded } = useAuth();
  
  if (!isPreferencesLoaded) {
    return (
      <div className="min-h-screen bg-babs-cream flex flex-col items-center justify-center gap-6 animate-pulse">
        <Logo className="w-20 h-20 opacity-50" />
        <div className="w-12 h-12 border-4 border-babs-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-babs-brown/40 uppercase tracking-[0.3em]">Synchro des réglages...</p>
      </div>
    );
  }

  const hasSelected = localStorage.getItem('has_selected_species') === 'true';
  const hasTypes = poultryTypes && poultryTypes.length > 0;
  
  if (!hasTypes && !hasSelected) return <Navigate to="/selection" replace />;
  return <Outlet />;
}

// Guard to ensure user has Pro or Business tier access
function ProGuard() {
  const { hasAccess, loading } = useAuth();
  if (loading) return null;
  if (!hasAccess('PRO')) return <Navigate to="/?upgrade=true" replace />;
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
