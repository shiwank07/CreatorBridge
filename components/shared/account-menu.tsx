"use client";

import { UserButton } from "@clerk/nextjs";
import { BarChart3, Bell, Bookmark, History, LayoutDashboard, Pencil, Settings, ShieldCheck, UserRound, Users } from "lucide-react";

import type { AuthenticatedRole } from "@/components/shared/navbar-client";

type AccountMenuProps = {
  role?: AuthenticatedRole;
  username?: string;
};

export function AccountMenu({ role, username }: AccountMenuProps) {
  const dashboardHref = role === "creator" ? "/dashboard/creator" : role === "brand" ? "/dashboard/brand" : role === "admin" ? "/admin" : "/dashboard";

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link href={dashboardHref} label={role === "admin" ? "Admin Dashboard" : "Dashboard"} labelIcon={<LayoutDashboard size={16} />} />
        {role === "creator" ? <UserButton.Link href={username ? `/creators/${username}` : "/dashboard/creator/edit"} label="My Profile" labelIcon={<UserRound size={16} />} /> : null}
        {role === "creator" ? <UserButton.Link href="/dashboard/creator/edit" label="Edit Profile" labelIcon={<Pencil size={16} />} /> : null}
        {role === "brand" ? <UserButton.Link href={username ? `/brands/${username}` : "/dashboard/brand/edit"} label="Brand Profile" labelIcon={<UserRound size={16} />} /> : null}
        {role === "brand" ? <UserButton.Link href="/dashboard/brand/edit" label="Edit Brand Profile" labelIcon={<Pencil size={16} />} /> : null}
        {role === "creator" || role === "brand" ? <UserButton.Link href="/dashboard/history" label="Collaborations" labelIcon={<History size={16} />} /> : null}
        {role === "brand" ? <UserButton.Link href="/dashboard/brand/saved-creators" label="Saved Creators" labelIcon={<Bookmark size={16} />} /> : null}
        {role === "creator" ? <UserButton.Link href="/dashboard/creator/analytics" label="Analytics" labelIcon={<BarChart3 size={16} />} /> : null}
        {role === "brand" ? <UserButton.Link href="/dashboard/brand/analytics" label="Analytics" labelIcon={<BarChart3 size={16} />} /> : null}
        {role === "admin" ? <UserButton.Link href="/admin/users" label="User Management" labelIcon={<Users size={16} />} /> : null}
        {role === "admin" ? <UserButton.Link href="/admin/reports" label="Reports" labelIcon={<BarChart3 size={16} />} /> : null}
        <UserButton.Link href="/notifications" label="Notifications" labelIcon={<Bell size={16} />} />
        {role === "creator" || role === "brand" ? <UserButton.Link href="/dashboard/verification" label="Verification" labelIcon={<ShieldCheck size={16} />} /> : null}
        <UserButton.Link href="/dashboard/settings/account" label="Account Settings" labelIcon={<Settings size={16} />} />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
