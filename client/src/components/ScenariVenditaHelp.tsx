import type { ReactElement } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function ScenarioHelp({ text, children }: { text: string; children: ReactElement }) {
  return (
    <TooltipPrimitive.Tooltip>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-[100] max-w-[320px] whitespace-normal rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-normal leading-relaxed text-slate-900 shadow-lg"
        >
          {text}
          <TooltipPrimitive.Arrow className="fill-white" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Tooltip>
  );
}
