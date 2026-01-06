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

function AppRouter() {
  const { authUser } = useAuthStore();
  const localAuthUser = localStorage.getItem("authUser");
  console.log("Auth User in Router:", authUser);
  console.log("Local Storage Auth User in Router:", localAuthUser);
  const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: [
        {
          path: "/",
          element: authUser ? <Home /> : <Navigate to="/login" replace />,
        },
        {
          path: "/signup",
          element: <SignupPage />,
        },
        {
          path: "/login",
          element: <LoginPage />,
        },
        {
          path: "/chat",
          element: authUser ? <ChatPage /> : <Navigate to="/login" replace />,
        },
        // Catch-all route for unknown paths
        {
          path: "*",
          element: authUser ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/login" replace />
          ),
        },
      ],
    },
  ]);
  // Use a key that changes when authUser changes to force RouterProvider to re-initialize
  return <RouterProvider router={router} key={authUser ? "auth" : "guest"} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
