import { createFileRoute } from "@tanstack/react-router";
import { socialConfigured } from "@/lib/auth/server";

export const Route = createFileRoute("/api/login-providers")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          email: socialConfigured.email,
          google: socialConfigured.google,
          kakao: socialConfigured.kakao,
          naver: socialConfigured.naver,
        }),
    },
  },
});
