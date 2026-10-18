import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-sm font-medium tracking-tight",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        // Amber primary — the signature button
        default: [
          "bg-primary text-primary-fg font-semibold",
          "shadow-sm shadow-primary/20",
          "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30",
          "active:translate-y-px",
        ].join(" "),

        // Outlined — clean, secondary actions
        outline: [
          "border border-border bg-transparent text-fg",
          "hover:bg-card hover:border-muted/40",
          "active:translate-y-px",
        ].join(" "),

        // Ghost — tertiary actions, close to text
        ghost: [
          "text-muted",
          "hover:bg-card hover:text-fg",
        ].join(" "),

        // Destructive — danger zone
        destructive: [
          "bg-destructive text-white font-semibold",
          "hover:bg-destructive/90",
          "active:translate-y-px",
        ].join(" "),

        // Secondary — a soft filled button that isn't primary
        secondary: [
          "bg-card border border-border text-fg",
          "hover:border-muted/50 hover:bg-card/80",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";