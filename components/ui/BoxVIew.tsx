import { ComponentPropsWithoutRef, ReactNode } from "react";

interface BoxViewProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "className"
> {
  children: ReactNode;
  className?: string;
}

export function BoxView({ children, className, ...rest }: BoxViewProps) {
  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-lg border-[3px] border-ink bg-cream shadow-[6px_6px_0_0_#151515] md:shadow-[8px_8px_0_0_#151515] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
