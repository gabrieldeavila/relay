import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/home/index.tsx"),
  route("images/:id", "pages/image/index.tsx"),
  route("videos/:id", "pages/video/index.tsx"),
] satisfies RouteConfig;
