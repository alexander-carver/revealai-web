"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-6">
      <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden />
      <p className="text-muted-foreground text-sm">Loading…</p>
      {showHint && (
        <p className="text-muted-foreground text-xs text-center max-w-xs">
          Taking a while? Try refreshing the page or opening in a different browser.
        </p>
      )}
    </div>
  );
}
