import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/shared/ErrorBoundary.jsx";
import App from "./App.jsx";
import "./index.css";

// Lazy load the page components
const WatchPage = lazy(() => import("./pages/Watch/WatchPage.jsx"));
const ListenPage = lazy(() => import("./pages/Listen/ListenPage.jsx"));
const ReadPage = lazy(() => import("./pages/Read/ReadPage.jsx"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <WatchPage /> },
      { path: "watch", element: <WatchPage /> },
      { path: "listen", element: <ListenPage /> },
      { path: "read", element: <ReadPage /> },
      { path: "write", element: <Navigate to="/read" replace /> },
    ],
  },
]);

// Simple loading fallback for suspense
const PageLoading = () => (
  <div className="page-loading">
    <h1>Loading...</h1>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);
