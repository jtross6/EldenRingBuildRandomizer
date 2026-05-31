import { Outlet } from "@tanstack/react-router";

export function RootLayout() {
  return (
    <main className="relative z-[1] mx-auto max-w-5xl px-4 pb-28 pt-6">
      <Outlet />
    </main>
  );
}
