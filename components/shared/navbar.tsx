import { NavbarClient, type AuthenticatedRole } from "@/components/shared/navbar-client";

type NavbarProps = {
  role?: AuthenticatedRole;
  username?: string;
};

/** Authenticated navigation only. It performs no authentication or database I/O. */
export function Navbar({ role, username }: NavbarProps) {
  return <NavbarClient role={role} username={username} />;
}
