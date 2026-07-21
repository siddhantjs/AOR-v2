import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LuArrowRight } from "react-icons/lu";
import { twMerge } from "tailwind-merge";

const variants = {
  primary: "border-transparent bg-red text-white hover:bg-red2",
  ghost: "border-white/30 bg-transparent text-white hover:border-white",
  inverse: "border-transparent bg-white text-navy hover:bg-bg-muted",
} as const;

const sizes = {
  sm: "rounded-sm px-4 py-2 text-sm",
  md: "rounded-md px-5 py-2.5 text-sm",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

type ButtonBase = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
};

type ButtonAsLink = ButtonBase &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children"> & {
    href: string;
  };

type ButtonAsButton = ButtonBase &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

function classes({
  variant = "primary",
  size = "md",
  className = "",
}: Pick<ButtonBase, "variant" | "size" | "className">) {
  return twMerge(
    "inline-flex items-center justify-center gap-2 border font-bold transition",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button(props: ButtonProps) {
  const { children, variant = "primary", size = "md", arrow, className = "" } = props;
  const cls = classes({ variant, size, className });
  const content = (
    <>
      {children}
      {arrow ? <LuArrowRight className="size-4 shrink-0" aria-hidden /> : null}
    </>
  );

  if ("href" in props && props.href != null) {
    const {
      href,
      children: _c,
      variant: _v,
      size: _s,
      arrow: _a,
      className: _cl,
      ...linkProps
    } = props;
    return (
      <Link href={href} className={cls} {...linkProps}>
        {content}
      </Link>
    );
  }

  const {
    children: _c,
    variant: _v,
    size: _s,
    arrow: _a,
    className: _cl,
    type = "button",
    ...buttonProps
  } = props;

  return (
    <button type={type} className={cls} {...buttonProps}>
      {content}
    </button>
  );
}
