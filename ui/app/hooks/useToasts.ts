import { useCallback, useState } from "react";

export interface ToastMessage {
  id: number;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}

let nextId = 1;

/** A small queue of toasts owned by the page that shows them. */
export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback((toast: Omit<ToastMessage, "id">) => {
    setToasts((current) => [...current, { ...toast, id: nextId++ }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, push, dismiss };
};
