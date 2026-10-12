import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("login", "pages/login/index.tsx"),
  layout("auth/components/RequireLogin.tsx", [
    index("pages/workflows/index.tsx"),
    route("connections", "pages/connections/index.tsx"),
    route("workflows/:id", "pages/editor/index.tsx"),
    route("workflows/:id/runs/:runId?", "pages/runs/index.tsx"),
  ]),
] satisfies RouteConfig;
