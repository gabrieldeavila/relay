import { memo } from "react";

import { LanguageSelect } from "@/app/components/LanguageSelect";
import { LoginForm } from "./components/LoginForm";

export function meta() {
  return [{ title: "Relay" }];
}

const Login = memo(() => (
  <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-(--color-bg) px-4 text-(--color-text)">
    <h1 className="text-3xl font-semibold">Relay</h1>
    <LoginForm />
    <div className="w-40">
      <LanguageSelect />
    </div>
  </main>
));

Login.displayName = "Login";

export default Login;
