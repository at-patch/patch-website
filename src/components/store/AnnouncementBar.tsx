"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Free shipping on orders over 5,000 BDT within Dhaka",
  "Size/fit exchanges within 7 days — no cash refunds or returns",
  "Every piece is 1-of-1 — once it sells, it's gone for good",
  "New limited batch drops every few weeks",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-patch-accent px-4 py-2 text-center text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-patch-accent-ink sm:px-0 sm:text-xs sm:tracking-[0.15em]">
      {MESSAGES[index]}
    </div>
  );
}
