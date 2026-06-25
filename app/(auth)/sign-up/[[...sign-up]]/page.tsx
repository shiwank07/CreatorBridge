import { SignUp } from "@clerk/nextjs";

import { AuthSetupNotice } from "@/components/shared/auth-setup-notice";
import { hasClerkKeys } from "@/lib/clerk-config";

export default function SignUpPage() {
  if (!hasClerkKeys()) return <AuthSetupNotice />;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignUp routing="path" path="/sign-up" />
    </main>
  );
}
