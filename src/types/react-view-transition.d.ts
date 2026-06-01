import type { ReactNode, ReactElement } from "react";

declare module "react" {
  interface ViewTransitionProps {
    name?: string;
    children: ReactNode;
    enter?: string;
    exit?: string;
    update?: string;
    share?: string;
    default?: string;
  }

  function ViewTransition(props: ViewTransitionProps): ReactElement;
}
