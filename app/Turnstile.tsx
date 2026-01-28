"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset?: (widgetId: string) => void;
    };
  }
}

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
};

export function Turnstile({ siteKey, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  // Keep latest callback without re-rendering the widget.
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;

    // Load Turnstile script once.
    const existing = document.querySelector('script[data-turnstile="1"]');
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.dataset.turnstile = "1";
      document.head.appendChild(s);
    }
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    const tryRender = () => {
      if (cancelled) return;
      if (!window.turnstile?.render) {
        setTimeout(tryRender, 100);
        return;
      }

      // Render only once per mount.
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(el, {
        sitekey: siteKey,
        theme: "auto",
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
      });
    };

    tryRender();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile?.reset) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey]);

  if (!siteKey) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        CAPTCHA is not configured. Set{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
          NEXT_PUBLIC_TURNSTILE_SITE_KEY
        </code>{" "}
        in your environment.
      </div>
    );
  }

  return <div ref={containerRef} />;
}

