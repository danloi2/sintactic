import * as React from "react";
import { cn } from "@/lib/utils";

const Motion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animation?: string;
  }
>(({ className, children, animation, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(animation && `animate-${animation}`, className)}
      {...props}
    >
      {children}
    </div>
  );
});
Motion.displayName = "Motion";

export { Motion };