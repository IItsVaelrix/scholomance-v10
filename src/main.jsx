import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./components/shared/ErrorBoundary.jsx";
import App from "./App.jsx";
import WatchPage from "./pages/Watch/WatchPage.jsx";
import ListenPage from "./pages/Listen/ListenPage.jsx";
import ReadPage from "./pages/Read/ReadPage.jsx";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <WatchPage /> },
      { path: "watch", element: <WatchPage /> },
      { path: "listen", element: <ListenPage /> },
      { path: "read", element: <ReadPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);
