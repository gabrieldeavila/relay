import { memo } from "react";

import { Toast, ToastViewport } from "@/ui/components/primitives/toast";
import type { ToastMessage } from "../hooks/useToasts";

type ToastsProps = { toasts: ToastMessage[]; onDismiss: (id: number) => void };

export const Toasts = memo(({ toasts, onDismiss }: ToastsProps) => (
  <ToastViewport position="bottom-right">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        variant={toast.variant}
        title={toast.title}
        description={toast.description}
        duration={5000}
        onClose={() => onDismiss(toast.id)}
      />
    ))}
  </ToastViewport>
));

Toasts.displayName = "Toasts";
