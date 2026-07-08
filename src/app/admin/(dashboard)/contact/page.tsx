"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, ContactMessage } from "@/types";

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<ContactMessage>>("/admin/contact");
    setMessages(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const toggleResolved = async (id: string, resolved: boolean) => {
    await axiosInstance.patch(`/admin/contact/${id}`, { resolved });
    load();
  };

  return (
    <div>
      <PageHeader icon={Mail} title="Contact Messages" description="Submissions from the storefront contact form." />

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>From</th>
            <th className={tableCellClass}>Subject</th>
            <th className={tableCellClass}>Message</th>
            <th className={tableCellClass}>Received</th>
            <th className={tableCellClass}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={5}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : messages.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={Mail} title="No messages yet" description="Contact form submissions will show up here." />
              </td>
            </tr>
          ) : (
            messages.map((msg) => (
              <tr key={msg._id} className={tableRowClass}>
                <td className={tableCellClass}>
                  <p className="text-patch-ink">{msg.name}</p>
                  <p className="text-xs text-patch-ink-muted">{msg.email}</p>
                </td>
                <td className={`${tableCellClass} text-patch-ink`}>{msg.subject}</td>
                <td className={`${tableCellClass} max-w-xs text-patch-ink-muted`}>
                  <p className="line-clamp-2">{msg.message}</p>
                </td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>
                  {new Date(msg.createdAt).toLocaleDateString()}
                </td>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-2">
                    <Badge tone={msg.resolved ? "green" : "rust"}>{msg.resolved ? "Resolved" : "Open"}</Badge>
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => toggleResolved(msg._id, !msg.resolved)}
                    >
                      Mark {msg.resolved ? "open" : "resolved"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
