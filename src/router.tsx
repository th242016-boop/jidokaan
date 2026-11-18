import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { IS_REVIEW_PREVIEW } from "@/lib/review-preview";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    // Static review hosts use directory indexes; include the slash before query
    // parameters so full reloads cannot lose them in a directory redirect.
    trailingSlash: (IS_REVIEW_PREVIEW ? "always" : "never") as "always" | "never",
    defaultErrorComponent: AppErrorComponent,
    defaultPreload: "intent",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
