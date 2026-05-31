import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "./components/layout/root-layout";
import { BuildViewerPage } from "./pages/build-viewer";

const rootRoute = createRootRoute({
  component: RootLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): { build?: string } => ({
    build: typeof search.build === "string" ? search.build : undefined,
  }),
  component: BuildViewerPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
