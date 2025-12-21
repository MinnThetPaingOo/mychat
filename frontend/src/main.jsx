import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Home from "./pages/ChatPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";
import PageLoader from "./components/pageLoader.jsx";

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { authUser, isCheckingAuth } = useAuthStore();
  console.log(authUser);

  if (isCheckingAuth) return <PageLoader />;
  return authUser ? children : <Navigate to="/login" replace />;
}

// Public route wrapper (redirect to home if logged in)
function PublicRoute({ children }) {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <PageLoader />;
  return authUser ? <Navigate to="/" replace /> : children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/signup",
        element: (
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        ),
      },

      {
        path: "/login",
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: "/chat",
        element: (
          <ProtectedRoute>
            <ChatPage />
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
