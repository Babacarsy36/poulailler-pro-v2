import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ChickenInventory } from "./components/ChickenInventory";
import { EggProduction } from "./components/EggProduction";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { SelectionPage } from "./components/SelectionPage";
import { useAuth } from "./AuthContext";

// Guard to ensure user is logged in
function AuthGuard() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-babs-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-babs-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Guard to ensure species is selected
function SelectionGuard() {
  const { poultryType } = useAuth();
  if (!poultryType) return <Navigate to="/selection" replace />;
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
              { path: "finances", lazy: loadFinancesRoute },
              { path: "incubator", lazy: loadIncubatorRoute },
            ],
          },
        ],
      },
    ],
  },
]);
