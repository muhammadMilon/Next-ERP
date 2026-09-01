"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/Badge";
import { DataGrid, FormGrid, LField, NoAccess, NoteBar, ScreenTitle, SectionHeading } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import {
  ACTIVE_STATUS,
  CPS_ROLES,
  PERMISSIONS,
  PERMISSION_LABEL,
  ROLE_ACCESS,
  type ActiveStatus,
  type CpsRole,
  type CpsUser,
  type Permission,
} from "@/lib/cps/types";
import { cn } from "@/lib/utils/cn";

const BLANK: CpsUser = {
  id: "",
  userId: "",
  name: "",
  unitCode: "",
  designation: "",
  email: "",
  role: "PR Creator",
  approvalLimit: "N/A",
  status: "Active",
  authentication: "Password / SSO",
  access: { ...ROLE_ACCESS["PR Creator"] },
};

export function CompanyUsers() {
  const { state, can, saveUser, removeUser, unitByCode } = useCps();
  const [form, setForm] = useState<CpsUser>({ ...BLANK, access: { ...BLANK.access } });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<CpsUser | null>(null);

  const editing = Boolean(form.id);
  const unitOptions = state.units.map((u) => `${u.code} — ${u.name}`);

  if (!can("manageMasters")) return <NoAccess what="Company User Registration" role={state.role} />;

  const set = <K extends keyof CpsUser>(key: K, value: CpsUser[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const setRole = (role: CpsRole) => {
    setForm((f) => ({ ...f, role, access: { ...ROLE_ACCESS[role] } }));
  };

  const toggle = (permission: Permission) =>
    setForm((f) => ({ ...f, access: { ...f.access, [permission]: !f.access[permission] } }));

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.userId.trim()) next.userId = "User ID is required";
    else if (state.users.some((u) => u.userId.toLowerCase() === form.userId.trim().toLowerCase() && u.id !== form.id))
      next.userId = "This user ID already exists";
    if (!form.name.trim()) next.name = "User name is required";
    if (!form.unitCode) next.unitCode = "Company unit is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }
    const user: CpsUser = { ...form, id: form.id || `user-${Date.now().toString(36)}` };
    saveUser(user);
    toast.success(`${user.name} ${editing ? "updated" : "registered"} as ${user.role}`);
    setForm({ ...BLANK, access: { ...ROLE_ACCESS["PR Creator"] } });
  };

  return (
    <>
      <ScreenTitle
        title="Company User Registration"
        hint="Each user belongs to one unit and carries an explicit access matrix."
        actions={
          <>
            {editing && (
              <Button icon={<X className="size-3.5" />} onClick={() => setForm({ ...BLANK, access: { ...ROLE_ACCESS["PR Creator"] } })}>
                Cancel edit
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Plus className="size-3.5" />}
              onClick={() => {
                setForm({ ...BLANK, access: { ...ROLE_ACCESS["PR Creator"] } });
                setErrors({});
              }}
            >
              New User
            </Button>
          </>
        }
      />

      <FormGrid cols={3}>
        <LField label="User ID" required error={errors.userId}>
          <Input
            value={form.userId}
            onChange={(e) => set("userId", e.target.value.toUpperCase())}
            placeholder="BEL-PR-001"
            invalid={Boolean(errors.userId)}
          />
        </LField>
        <LField label="User Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Md. Rahim"
            invalid={Boolean(errors.name)}
          />
        </LField>
        <LField label="Company Unit" required error={errors.unitCode}>
          <Select
            options={unitOptions}
            value={form.unitCode ? `${form.unitCode} — ${unitByCode(form.unitCode)?.name ?? ""}` : ""}
            placeholder="Select unit"
            onChange={(e) => set("unitCode", e.target.value.split(" — ")[0])}
            invalid={Boolean(errors.unitCode)}
          />
        </LField>

        <LField label="Designation">
          <Input
            value={form.designation}
            onChange={(e) => set("designation", e.target.value)}
            placeholder="Purchase Executive"
          />
        </LField>
        <LField label="Email" required error={errors.email}>
          <Input
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="user@baygroup.com"
            invalid={Boolean(errors.email)}
          />
        </LField>
        <LField label="Role" required hint="Selecting a role pre-fills the access matrix below">
          <Select
            options={CPS_ROLES}
            value={form.role}
            placeholder="Select role"
            onChange={(e) => setRole(e.target.value as CpsRole)}
          />
        </LField>

        <LField label="Approval Limit">
          <Input
            value={form.approvalLimit}
            onChange={(e) => set("approvalLimit", e.target.value)}
            placeholder="N/A"
          />
        </LField>
        <LField label="Status">
          <Select
            options={ACTIVE_STATUS}
            value={form.status}
            placeholder="Select status"
            onChange={(e) => set("status", e.target.value as ActiveStatus)}
          />
        </LField>
        <LField label="Authentication">
          <Select
            options={["Password / SSO", "Password", "SSO"]}
            value={form.authentication}
            placeholder="Select method"
            onChange={(e) => set("authentication", e.target.value as CpsUser["authentication"])}
          />
        </LField>
      </FormGrid>

      <SectionHeading>Access Matrix</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PERMISSIONS.map((permission) => {
          const on = form.access[permission];
          return (
            <button
              key={permission}
              type="button"
              onClick={() => toggle(permission)}
              aria-pressed={on}
              className={cn(
                "focus-brand flex items-center gap-2.5 rounded-lg border px-4 py-3 text-left text-[13px] font-medium transition-colors",
                on
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
              )}
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold text-white",
                  on ? "border-brand-600 bg-brand-600" : "border-ink-300 bg-white",
                )}
                aria-hidden
              >
                {on ? "✓" : ""}
              </span>
              {PERMISSION_LABEL[permission]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" size="md" icon={<Save className="size-4" />} onClick={submit}>
          {editing ? "Update User" : "Save User"}
        </Button>
      </div>

      <SectionHeading>Registered Users</SectionHeading>
      <DataGrid
        columns={[
          { key: "userId", label: "User ID", mono: true, width: "130px" },
          { key: "name", label: "User Name" },
          { key: "unitCode", label: "Unit", mono: true, width: "110px" },
          { key: "designation", label: "Designation" },
          { key: "role", label: "Role", width: "150px" },
          { key: "approvalLimit", label: "Approval Limit", align: "right" },
          { key: "status", label: "Status", width: "110px", render: (u: CpsUser) => <StatusPill value={u.status} /> },
          {
            key: "action",
            label: "Action",
            align: "right",
            width: "120px",
            render: (u: CpsUser) => (
              <span className="flex justify-end gap-1">
                <Button
                  size="xs"
                  variant="ghost"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => {
                    setForm({ ...u, access: { ...u.access } });
                    setErrors({});
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </Button>
                <Button size="xs" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={() => setToDelete(u)}>
                  <span className="sr-only">Delete</span>
                </Button>
              </span>
            ),
          },
        ]}
        rows={state.users}
        rowKey={(u) => u.id}
        empty="No user registered yet."
      />

      <NoteBar className="mt-5">
        Role-based access is enforced end to end: a user without “Approve PR” never sees the approval decision
        buttons, and without “Consolidate Demand” cannot open central consolidation.
      </NoteBar>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          removeUser(toDelete);
          toast.success(`${toDelete.name} removed`);
          if (form.id === toDelete.id) setForm({ ...BLANK, access: { ...ROLE_ACCESS["PR Creator"] } });
        }}
        title={`Delete ${toDelete?.name ?? ""}?`}
        body="The user will no longer be able to sign in or appear as a requester or approver on new documents."
      />
    </>
  );
}
