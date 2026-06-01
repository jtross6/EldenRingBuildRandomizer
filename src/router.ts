import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "./components/layout/root-layout";
import { LandingPage } from "./pages/landing";
import { BuildViewerPage } from "./pages/build-viewer";
import { GeneratePage } from "./pages/generate";
import { PicksPage } from "./pages/picks";

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

export const picksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generate/picks",
  component: PicksPage,
});

export const generateBuildRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generate/build",
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  randomRoute,
  generateRoute,
  picksRoute,
  generateBuildRoute,
]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
