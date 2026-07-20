"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Badge,
  EmptyState,
  IconButton,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, Lead } from "@/types";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Lead>>("/admin/leads");
    setLeads(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const toggleResolved = async (lead: Lead) => {
    await axiosInstance.patch(`/admin/leads/${lead._id}`, { resolved: !lead.resolved });
    load();
  };

  const deleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Delete lead "${name}"? This can't be undone.`)) return;
    await axiosInstance.delete(`/admin/leads/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={UserPlus}
        title="Leads"
        description="Contacts captured by the chat assistant for follow-up."
      />

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Name</th>
            <th className={tableCellClass}>Contact</th>
            <th className={tableCellClass}>Interest</th>
            <th className={tableCellClass}>Captured</th>
            <th className={tableCellClass}>Status</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={6}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : leads.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={UserPlus}
                  title="No leads yet"
                  description="When the chat assistant captures a contact, it'll show up here."
                />
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead._id} className={tableRowClass}>
                <td className={`${tableCellClass} font-medium text-patch-ink`}>{lead.name}</td>
                <td className={`${tableCellClass} text-patch-ink`}>{lead.contact}</td>
                <td className={`${tableCellClass} max-w-xs text-patch-ink-muted`}>{lead.interest || "—"}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
                <td className={tableCellClass}>
                  <button onClick={() => toggleResolved(lead)} title="Toggle followed-up">
                    <Badge tone={lead.resolved ? "green" : "rust"}>
                      {lead.resolved ? "followed up" : "new"}
                    </Badge>
                  </button>
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <IconButton
                    icon={Trash2}
                    label="Delete lead"
                    tone="danger"
                    onClick={() => deleteLead(lead._id, lead.name)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
