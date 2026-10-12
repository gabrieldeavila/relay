import { memo } from "react";
import { Navigate, Outlet } from "react-router";

import { Spinner } from "@/ui/components/primitives/spinner";
import { useSession } from "../hooks/useSession";

/** Layout route: pages inside it need a logged-in user. */
const RequireLogin = memo(() => {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return session ? <Outlet /> : <Navigate to="/login" replace />;
});

RequireLogin.displayName = "RequireLogin";

export default RequireLogin;
