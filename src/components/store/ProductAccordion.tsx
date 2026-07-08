"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductAccordion({
  sections,
}: {
  sections: { title: string; body: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-patch-line border-y border-patch-line">
      {sections.map((section, i) => (
        <div key={section.title}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-patch-ink"
          >
            {section.title}
            <ChevronDown size={16} className={cn("transition-transform", open === i && "rotate-180")} />
          </button>
          {open === i && (
            <div className="pb-4 text-sm leading-relaxed text-patch-ink-muted">{section.body}</div>
          )}
        </div>
      ))}
    </div>
  );
}
