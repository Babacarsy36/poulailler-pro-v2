import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ChickenInventory } from "./components/ChickenInventory";
import { EggProduction } from "./components/EggProduction";
import { FeedManagement } from "./components/FeedManagement";
import { HealthTracking } from "./components/HealthTracking";
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
              { path: "feed", Component: FeedManagement },
              { path: "health", Component: HealthTracking },
            ],
          },
        ],
      },
    ],
  },
]);
