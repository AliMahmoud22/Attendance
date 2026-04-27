import { Routes, Route, Navigate } from "react-router-dom";
//import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth.jsx";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AccessDenied from "./pages/AccessDenied";
import EditProfile from "./pages/EditProfile";
import ManageUsers from "./pages/ManageUsers";
import MachinesPage from "./pages/MachinesPage.jsx";
import DepartmentsPage from "./pages/DepartmentsPage.jsx";
import ConnectivityPage from "./pages/ConnectivityPage.jsx";

/* ── Auth guard ── */
function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );

  if (!user) return <Navigate to="/account/login" replace />;
  if (requiredRole && user.role !== requiredRole)
    return <Navigate to="/account/access-denied" replace />;

  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <main
        className="pt-16 
        min-h-screen 
        bg-gray-100 dark:bg-gray-900 
        text-gray-800 dark:text-gray-100 
        transition-colors duration-300"
      >
        <Routes>
          {/* Public */}
          <Route path="/account/login" element={<LoginPage />} />
          <Route path="/account/access-denied" element={<AccessDenied />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/account/profile"
            element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/account/users"
            element={
              <PrivateRoute requiredRole="IT">
                <ManageUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/machines"
            element={
              <PrivateRoute>
                <MachinesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <PrivateRoute>
                <DepartmentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/machines/connectivity"
            element={
              <PrivateRoute>
                <ConnectivityPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
