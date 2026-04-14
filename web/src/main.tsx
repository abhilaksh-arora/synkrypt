import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OrgProvider } from "./context/OrgContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./index.css";

import LoginPage from "./pages/LoginPage";
import AppLayout from "./pages/AppLayout";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import UsersPage from "./pages/UsersPage";
import PresetsPage from "./pages/PresetsPage";
import DocsPage from "./pages/DocsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import VaultPage from "./pages/VaultPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user?.isAdmin !== true) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <OrgProvider>
          <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route element={<AppLayout />}>
                <Route path="/docs" element={<DocsPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vault" element={<VaultPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />

                {/* Admin Only */}
                <Route
                  path="/users"
                  element={
                    <AdminRoute>
                      <UsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/presets"
                  element={
                    <AdminRoute>
                      <PresetsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <AdminRoute>
                      <AuditLogsPage />
                    </AdminRoute>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </OrgProvider>
    </AuthProvider>
  </ThemeProvider>
  </StrictMode>,
);
