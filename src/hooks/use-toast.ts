import { useState, useCallback, useRef } from "react";

export function useToast(duration = 2000) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const show = useCallback(
    (msg: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(msg);
      timeoutRef.current = setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );

  return { message, show };
}
