// src/components/Footer.tsx
"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [version, setVersion] = useState<string>("...");

  useEffect(() => {
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => setVersion(data.version))
      .catch(() => setVersion("unknown"));
  }, []);

  return (
    <footer className="w-full text-center text-xs text-muted-foreground py-4 border-t border-border">
      <p>nApi version <strong>{version}</strong></p>
      <p className="mt-1">&copy; {new Date().getFullYear()} zatto</p>
    </footer>
  );
}