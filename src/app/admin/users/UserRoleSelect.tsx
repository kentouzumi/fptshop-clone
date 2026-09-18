"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_OPTIONS = ["CUSTOMER", "STAFF", "ADMIN", "SUPER_ADMIN"];

export default function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [saving, setSaving] = useState(false);

  async function handleChange(newRole: string) {
    setValue(newRole);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error ?? "Đổi vai trò thất bại.");
        setValue(role);
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
    >
      {ROLE_OPTIONS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
