"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return offline ? <div className="fixed left-3 right-3 top-3 z-50 rounded-xl border border-line bg-raised px-3 py-2 text-center text-xs font-medium text-muted shadow-lg">You’re offline. Saved pages remain available.</div> : null;
}
