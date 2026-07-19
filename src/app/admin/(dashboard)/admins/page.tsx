"use client";

import { useEffect, useState } from "react";
import { Lock, Mail, Plus, ShieldCheck, Trash2, Type, UserCog } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormSelect,
  IconButton,
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { AdminRole, AdminUser, ApiListResponse, ApiResponse } from "@/types";

const emptyForm = { name: "", email: "", password: "", role: "staff" as AdminRole };

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const [{ data: me }, { data }] = await Promise.all([
        axiosInstance.get<ApiResponse<{ email: string; role: AdminRole }>>("/admin/me"),
        axiosInstance.get<ApiListResponse<AdminUser>>("/admin/admins"),
      ]);
      setCurrentEmail(me.data.email);
      setAdmins(data.data);
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 403) {
        setForbidden(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await axiosInstance.post("/admin/admins", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add admin.");
    }
  };

  const toggleActive = async (admin: AdminUser) => {
    try {
      await axiosInstance.patch(`/admin/admins/${admin._id}`, { active: !admin.active });
      load();
    } catch (err) {
      window.alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update admin.");
    }
  };

  const toggleRole = async (admin: AdminUser) => {
    const nextRole: AdminRole = admin.role === "owner" ? "staff" : "owner";
    try {
      await axiosInstance.patch(`/admin/admins/${admin._id}`, { role: nextRole });
      load();
    } catch (err) {
      window.alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update admin.");
    }
  };

  const deleteAdmin = async (admin: AdminUser) => {
    if (!window.confirm(`Remove ${admin.name} (${admin.email})? This can't be undone.`)) return;
    try {
      await axiosInstance.delete(`/admin/admins/${admin._id}`);
      load();
    } catch (err) {
      window.alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete admin.");
    }
  };

  if (!loading && forbidden) {
    return (
      <div>
        <PageHeader icon={UserCog} title="Admins" description="Manage who can sign in to this dashboard." />
        <EmptyState
          icon={Lock}
          title="Owner access required"
          description="Only an owner can manage admin accounts. If your role was just upgraded, sign out and back in to refresh your session."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={UserCog}
        title="Admins"
        description="Manage who can sign in to this dashboard."
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            New admin
          </Button>
        }
      />

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setError(null);
        }}
        icon={UserCog}
        title="New admin"
        description="They'll sign in with this email and password — share it with them separately."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormInput icon={Type} label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <FormInput icon={Mail} label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <FormInput icon={Lock} label="Temporary password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          <FormSelect icon={ShieldCheck} label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v as AdminRole })}>
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </FormSelect>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit">Add admin</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
          {error && (
            <div className="sm:col-span-2">
              <ErrorBanner>{error}</ErrorBanner>
            </div>
          )}
        </form>
      </Modal>

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Name</th>
            <th className={tableCellClass}>Email</th>
            <th className={tableCellClass}>Role</th>
            <th className={tableCellClass}>Status</th>
            <th className={tableCellClass}>Last login</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={6}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : admins.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState icon={UserCog} title="No admins yet" />
              </td>
            </tr>
          ) : (
            admins.map((admin) => {
              const isSelf = admin.email === currentEmail;
              return (
                <tr key={admin._id} className={tableRowClass}>
                  <td className={`${tableCellClass} font-medium text-patch-ink`}>
                    {admin.name} {isSelf && <span className="text-xs text-patch-ink-muted">(you)</span>}
                  </td>
                  <td className={`${tableCellClass} text-patch-ink-muted`}>{admin.email}</td>
                  <td className={tableCellClass}>
                    <button onClick={() => toggleRole(admin)} disabled={isSelf} title={isSelf ? "You can't change your own role" : "Toggle role"}>
                      <Badge tone={admin.role === "owner" ? "green" : "neutral"}>{admin.role}</Badge>
                    </button>
                  </td>
                  <td className={tableCellClass}>
                    <button onClick={() => toggleActive(admin)} disabled={isSelf} title={isSelf ? "You can't deactivate yourself" : "Toggle active"}>
                      <Badge tone={admin.active ? "green" : "red"}>{admin.active ? "active" : "disabled"}</Badge>
                    </button>
                  </td>
                  <td className={`${tableCellClass} text-patch-ink-muted`}>
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className={`${tableCellClass} text-right`}>
                    {!isSelf && (
                      <IconButton icon={Trash2} label="Remove admin" tone="danger" onClick={() => deleteAdmin(admin)} />
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
