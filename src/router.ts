import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "./components/layout/root-layout";
import { LandingPage } from "./pages/landing";
import { BuildViewerPage } from "./pages/build-viewer";
import { GeneratePage } from "./pages/generate";

const rootRoute = createRootRoute({
  component: RootLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

export const randomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/random",
  validateSearch: (search: Record<string, unknown>): { build?: string } => ({
    build: typeof search.build === "string" ? search.build : undefined,
  }),
  component: BuildViewerPage,
});

export const generateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generate",
  component: GeneratePage,
});

const routeTree = rootRoute.addChildren([indexRoute, randomRoute, generateRoute]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
