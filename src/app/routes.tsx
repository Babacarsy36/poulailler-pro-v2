import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ChickenInventory } from "./components/ChickenInventory";
import { EggProduction } from "./components/EggProduction";
import { FeedManagement } from "./components/FeedManagement";
import { Login } from "./components/Login";
import { useAuth } from "./AuthContext";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { poultryType } = useAuth();
  if (!poultryType) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "inventory", Component: ChickenInventory },
      { path: "eggs", Component: EggProduction },
      { path: "feed", Component: FeedManagement },
    ],
  },
]);
