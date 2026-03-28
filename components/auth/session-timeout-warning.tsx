"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExtendSession } from "@/lib/hooks/use-sessions";

interface SessionTimeoutWarningProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export const SessionTimeoutWarning = ({ timeoutMinutes = 30, warningMinutes = 5 }: SessionTimeoutWarningProps) => {
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = Math.max(1, warningMinutes) * 60 * 1000;
  const [lastActive, setLastActive] = useState(() => Date.now());
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(warningMinutes * 60);
  const extend = useExtendSession();

  const handleActivity = useCallback(() => {
    setLastActive(Date.now());
    setVisible(false);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, handleActivity));
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [handleActivity]);

  useEffect(() => {
    const ticker = setInterval(() => {
      const idle = Date.now() - lastActive;
      if (idle >= timeoutMs) {
        setVisible(false);
        window.location.assign("/login?reason=timeout");
        clearInterval(ticker);
        return;
      }
      if (idle >= timeoutMs - warningMs) {
        setVisible(true);
        setCountdown(Math.max(0, Math.round((timeoutMs - idle) / 1000)));
      } else {
        setVisible(false);
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastActive, timeoutMs, warningMs]);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(countdown / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(countdown % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [countdown]);

  const stayLoggedIn = useCallback(async () => {
    try {
      await extend.mutateAsync();
    } finally {
      handleActivity();
    }
  }, [extend, handleActivity]);

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && setVisible(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
          <DialogDescription>Your session will expire soon due to inactivity.</DialogDescription>
        </DialogHeader>
        <div className="text-center text-3xl font-semibold">{formattedCountdown}</div>
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => window.location.assign("/login")}>Log out</Button>
          <Button className="flex-1" onClick={stayLoggedIn} disabled={extend.isPending}>
            {extend.isPending ? "Refreshing…" : "Stay logged in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
