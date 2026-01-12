import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import App from "../../src/App.jsx";
import WatchPage from "../../src/pages/Watch/WatchPage.jsx";
import ListenPage from "../../src/pages/Listen/ListenPage.jsx";
import ReadPage from "../../src/pages/Read/ReadPage.jsx";
import { createColorEngine } from "../../src/engines/colorEngine/index.ts";
import { vi } from "vitest";

const engine = createColorEngine({
  isEnrichmentEnabled: () => false,
});

vi.mock("../../src/hooks/useColorEngine.jsx", () => ({
  ColorEngineProvider: ({ children }) => children,
  useColorEngine: () => ({
    isReady: true,
    engine,
    revision: 0,
  }),
}));

const makeRouter = (initialEntries) =>
  createMemoryRouter(
    [
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
    ],
    { initialEntries }
  );

describe("Navigation", () => {
  it("defaults to Watch page", () => {
    const router = makeRouter(["/"]);
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("heading", { name: /ritual ui/i })).toBeInTheDocument();
  });

  it("navigates to Listen page", async () => {
    const router = makeRouter(["/"]);
    render(<RouterProvider router={router} />);
    await userEvent.click(screen.getByRole("link", { name: /listen/i }));
    expect(screen.getByRole("heading", { name: /tune the school/i })).toBeVisible();
  });

  it("navigates to Read page", async () => {
    const router = makeRouter(["/"]);
    render(<RouterProvider router={router} />);
    await userEvent.click(screen.getByRole("link", { name: /read/i }));
    expect(screen.getByLabelText(/scroll title/i)).toBeVisible();
  });

  it("highlights active navigation item", () => {
    const router = makeRouter(["/listen"]);
    const { container } = render(<RouterProvider router={router} />);
    const activeLink = container.querySelector("nav a.navLinkActive");
    expect(activeLink).toHaveTextContent(/listen/i);
  });
});
