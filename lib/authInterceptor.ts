/**
 * HAVLOOK — Auth bootstrap + terminal auth-failure interceptor
 *
 * The access-token getter is registered at module evaluation time in the
 * browser, not in a React effect. This is deliberate: child page effects can
 * issue API requests before the root layout's effects run. Registering the
 * getter synchronously prevents those first requests from leaving without
 * their persisted Bearer token.
 *
 * The token refresher and navigation-aware failure handler remain in the
 * component effect because they depend on client lifecycle/router state.
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  registerAuthFailureHandler,
  registerAuthTokenGetter,
  registerTokenRefresher,
} from "@/lib/api";
import { refreshAuthSession } from "@/lib/tokenRefresh";
import useAuthStore from "@/store/authStore";

/**
 * Read the live Zustand token first, then fall back to the persisted token.
 * Never log or expose the token. Access to window/localStorage is guarded so
 * this module remains safe if Next.js evaluates the client module on the
 * server during prerendering.
 */
function readAccessToken(): string | null {
  const stateToken = useAuthStore.getState().token;
  if (stateToken) return stateToken;

  if (typeof window === "undefined") return null;

  try {
    const persisted = window.localStorage.getItem("HAVLOOK-auth");
    if (!persisted) return null;

    const parsed: unknown = JSON.parse(persisted);
    if (!parsed || typeof parsed !== "object") return null;

    const persistedState = (parsed as { state?: unknown }).state;
    if (!persistedState || typeof persistedState !== "object") return null;

    const token = (persistedState as { token?: unknown }).token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

// Register synchronously when this client module is evaluated. Do not move
// this into useEffect: page-level effects may call apiRequest before the root
// layout's effects have registered the getter.
if (typeof window !== "undefined") {
  registerAuthTokenGetter(readAccessToken);
}

/** Routes that are themselves the "auth surface" — never redirect on these. */
const AUTH_ROUTES = new Set<string>([
  "/login",
  "/signup",
  "/forgot-password",
  "/seller/login",
  "/seller/signup",
  "/admin/login",
]);

function safeResumePath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (AUTH_ROUTES.has(path.split("?")[0] ?? "")) return null;
  return path;
}

function loginPathFor(currentPath: string | null): string {
  if (currentPath === "/seller" || currentPath?.startsWith("/seller/")) {
    return "/seller/login";
  }
  if (currentPath === "/admin" || currentPath?.startsWith("/admin/")) {
    return "/admin/login";
  }
  return "/login";
}

export default function AuthClientBootstrap(): null {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Restore Zustand's in-memory state. The token getter already has a
    // synchronous localStorage fallback, so requests made before this finishes
    // still carry the persisted access token.
    void useAuthStore.persist.rehydrate();

    const unregisterRefresher = registerTokenRefresher(refreshAuthSession);

    let inFlight = false;
    const handleAuthFailure = (status: number) => {
      if (inFlight) return;
      inFlight = true;

      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : pathname;
      const currentSearch =
        typeof window !== "undefined" ? window.location.search : "";

      if (currentPath && AUTH_ROUTES.has(currentPath)) {
        useAuthStore.getState().logout();
        requestAnimationFrame(() => {
          inFlight = false;
        });
        return;
      }

      useAuthStore.getState().logout();
      const loginPath = loginPathFor(currentPath);
      const resumePath = safeResumePath(
        currentPath ? `${currentPath}${currentSearch}` : null,
      );
      const target = resumePath
        ? `${loginPath}?reason=session-expired&status=${status}&return=${encodeURIComponent(resumePath)}`
        : `${loginPath}?reason=session-expired&status=${status}`;
      router.push(target);

      requestAnimationFrame(() => {
        inFlight = false;
      });
    };

    const unregisterHandler = registerAuthFailureHandler(handleAuthFailure);

    return () => {
      unregisterRefresher();
      unregisterHandler();
    };
  }, [router, pathname]);

  return null;
}
