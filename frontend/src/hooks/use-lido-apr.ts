"use client";

import { useState, useEffect } from "react";

export function useLidoApr() {
  const [apr, setApr] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/lido-apr")
      .then((r) => r.json())
      .then((d) => setApr(d.apr))
      .catch(() => setApr(null));
  }, []);

  return apr;
}
