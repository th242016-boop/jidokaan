import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS, assertSession } from "@/lib/admin-auth.server";
import {
  exportEmsOrders,
  getEmsCapabilities,
  mutateEms,
  prepareEmsOrders,
  readEmsOrder,
  refreshEmsTracking,
} from "@/lib/ems.server";
import { emsIssues } from "@/lib/ems-workflow";
import type { EmsAction } from "@/lib/ems-types";
import { proxyToLive, shouldProxyToLive } from "@/lib/live-proxy.server";
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: AUTH_HEADERS });
const tokenFor = (request: Request, body?: Record<string, unknown>) =>
  request.headers.get("Authorization")?.replace(/^Bearer /, "") || String(body?.token || "");
const errorResponse = (error: unknown) => {
  const errorText = error instanceof Error ? error.message : "EMS_FAILED";
  return json(
    { error: errorText },
    errorText === "AUTH"
      ? 401
      : errorText === "NOT_FOUND"
        ? 404
        : errorText === "ORDER_CHANGED"
          ? 409
          : 400,
  );
};
export const Route = createFileRoute("/api/ems")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (shouldProxyToLive(request)) return proxyToLive(request, "/api/ems");
        try {
          const token = tokenFor(request);
          await assertSession(token);
          const id = new URL(request.url).searchParams.get("id");
          return json(id ? await readEmsOrder(token, id) : { capabilities: getEmsCapabilities() });
        } catch (error) {
          return errorResponse(error);
        }
      },
      POST: async ({ request }) => {
        if (shouldProxyToLive(request)) return proxyToLive(request, "/api/ems");
        try {
          const body = (await request.json()) as Record<string, unknown>,
            token = tokenFor(request, body);
          await assertSession(token);
          const action = String(body.action || "");
          if (action === "prepare")
            return json(await prepareEmsOrders(token, body.ids as string[]));
          if (action === "export") return json(await exportEmsOrders(token, body.ids as string[]));
          const id = String(body.id || ""),
            version = Number(body.version),
            operationId = String(body.operationId || "");
          if (action === "track") {
            const order = await refreshEmsTracking(
              token,
              id,
              version,
              operationId,
              String(body.packageId || ""),
              body.confirmed === true,
            );
            return json({ order, capabilities: getEmsCapabilities(), issues: emsIssues(order) });
          }
          if (
            ![
              "save",
              "register",
              "record_posted",
              "uncertain",
              "failed",
              "reconcile",
              "handover",
            ].includes(action)
          )
            throw new Error("EMS_BAD_ACTION");
          // Only action-specific fields reach the workflow. Provider evidence/state is never accepted.
          let mutation: EmsAction;
          if (action === "save")
            mutation = { action, recipient: body.recipient, packages: body.packages } as EmsAction;
          else if (action === "handover")
            mutation = {
              action,
              packageIds: body.packageIds as string[],
              confirmed: body.confirmed === true,
            };
          else if (action === "register" || action === "record_posted")
            mutation = {
              action,
              packageId: String(body.packageId || ""),
              tracking: String(body.tracking || ""),
              reference: String(body.reference || ""),
              confirmed: body.confirmed === true,
            };
          else if (action === "reconcile") {
            if (body.outcome !== "not_registered" && body.outcome !== "registered")
              throw new Error("EMS_BAD_ACTION");
            mutation = {
              action,
              packageId: String(body.packageId || ""),
              outcome: body.outcome,
              reference: String(body.reference || ""),
              tracking: String(body.tracking || ""),
              confirmed: body.confirmed === true,
            };
          } else
            mutation = {
              action: action as "uncertain" | "failed",
              packageId: String(body.packageId || ""),
              note: String(body.note || ""),
            };
          const order = await mutateEms(token, id, version, operationId, mutation);
          return json({ order, capabilities: getEmsCapabilities(), issues: emsIssues(order) });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
