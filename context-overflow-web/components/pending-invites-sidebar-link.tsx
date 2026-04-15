"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function PendingInvitesSidebarLink({
  closeMobile,
}: {
  closeMobile: () => void;
}) {
  const { user, getIdToken } = useAuth();
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const fetchPending = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/invites/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCount(Array.isArray(data) ? data.length : 0);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    void fetchPending();
  }, [fetchPending, pathname]);

  if (!user || count === 0) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={pathname === "/invites"}
        tooltip={`View invites (${count})`}
        render={<Link href="/invites" onClick={closeMobile} />}
      >
        <Mail strokeWidth={2} />
        <span>
          View invites ({count})
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
