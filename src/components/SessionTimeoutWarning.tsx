import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_SEC = 120; // 2 minutes

const SessionTimeoutWarning = () => {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const resetTimer = useCallback(() => {
    if (!user) return;
    setShowWarning(false);
    setCountdown(COUNTDOWN_SEC);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(COUNTDOWN_SEC);
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            signOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_MS);
  }, [user, signOut]);

  useEffect(() => {
    if (!user) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => document.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, resetTimer]);

  if (!showWarning || !user) return null;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            You've been inactive for 15 minutes. Your session will expire in{" "}
            <span className="font-bold text-destructive">{mins}:{String(secs).padStart(2, "0")}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={resetTimer}>Stay Logged In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutWarning;
