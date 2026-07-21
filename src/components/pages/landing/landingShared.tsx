import type { ReactNode } from "react";
import { LuCheck } from "react-icons/lu";

export const GUIDE_URL = "https://www.getnorthpath.com/tools/pr-tracker";
export const WHATSAPP_URL = "https://chat.whatsapp.com/REPLACE-WITH-INVITE";
export const FACEBOOK_URL = "https://www.facebook.com/groups/REPLACE-WITH-GROUP";
export const DISCORD_URL = "https://discord.gg/7cd2dHVNX2";

export function CheckIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return <LuCheck className={className} aria-hidden strokeWidth={2.5} />;
}

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-xs font-bold tracking-widest text-red uppercase ${className}`}>
      {children}
    </span>
  );
}

export function CheckList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="my-4 list-none space-y-0 p-0">
      {items.map((item) => (
        <li key={item.title} className="flex gap-2.5 py-1.5 text-sm text-muted">
          <span className="mt-0.5 shrink-0 text-green" aria-hidden>
            <LuCheck size={16} strokeWidth={2.5} />
          </span>
          <span>
            <b className="font-semibold text-ink">{item.title}</b> — {item.body}
          </span>
        </li>
      ))}
    </ul>
  );
}
