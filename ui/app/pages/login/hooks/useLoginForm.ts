import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import { supabase } from "@/app/auth/api/supabase-client";
import { authErrorKey } from "@/app/auth/domain/auth-error-key";

export type LoginMode = "signIn" | "signUp";

/** Email + password against the local Supabase; no email confirmation locally. */
export const useLoginForm = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorKey(null);
    const credentials = { email: email.trim(), password };
    const { error } =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
    setSubmitting(false);
    if (error) return setErrorKey(authErrorKey(error.code));
    void navigate("/", { replace: true });
  };

  const toggleMode = () => {
    setMode(mode === "signIn" ? "signUp" : "signIn");
    setErrorKey(null);
  };

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    errorKey,
    submitting,
    submit,
    toggleMode,
  };
};
