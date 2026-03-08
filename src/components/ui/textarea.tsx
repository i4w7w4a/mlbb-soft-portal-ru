import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-36 w-full rounded-[24px] border border-white/12 bg-black/30 px-4 py-3 text-base leading-7 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/20",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

