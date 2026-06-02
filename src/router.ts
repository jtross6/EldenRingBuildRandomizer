import {
  createRouter,
  createRoute,
  createRootRoute,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { RootLayout } from "./components/layout/root-layout";

const rootRoute = createRootRoute({
  component: RootLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./pages/landing"), "LandingPage"),
});

export const randomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/random",
  validateSearch: (search: Record<string, unknown>): { build?: string } => ({
    build: typeof search.build === "string" ? search.build : undefined,
  }),
  component: lazyRouteComponent(() => import("./pages/build-viewer"), "BuildViewerPage"),
});

export const generateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generate",
  component: lazyRouteComponent(() => import("./pages/generate"), "GeneratePage"),
});

export const picksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generate/picks",
  component: lazyRouteComponent(() => import("./pages/picks"), "PicksPage"),
});

export const generateBuildRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generate/build",
  component: lazyRouteComponent(() => import("./pages/generate-build"), "GenerateBuildPage"),
});

export const fateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fate",
  validateSearch: (search: Record<string, unknown>): { fate?: string } => ({
    fate: typeof search.fate === "string" ? search.fate : undefined,
  }),
  component: lazyRouteComponent(() => import("./pages/fate"), "FatePage"),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  randomRoute,
  generateRoute,
  picksRoute,
  generateBuildRoute,
  fateRoute,
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
