import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";

import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { authUser } = useAuthStore();
  
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Auth Route wrapper (redirects to home if already logged in)
function AuthRoute({ children }) {
  const { authUser } = useAuthStore();
  
  if (authUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Create router outside component - routes don't change
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/signup",
        element: (
          <AuthRoute>
            <SignupPage />
          </AuthRoute>
        ),
      },
      {
        path: "/login",
        element: (
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        ),
      },
      {
        path: "*",
        element: (
          <ProtectedRoute>
            <Navigate to="/" replace />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
