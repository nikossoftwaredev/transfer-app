"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/auth/profile-avatar";
import { Link } from "@/lib/i18n/navigation";
import { LogIn } from "lucide-react";

export const LoginButton = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="outline" size="icon" disabled>
        <LogIn className="h-4 w-4" />
      </Button>
    );
  }

  if (session?.user) {
    return (
      <ProfileAvatar
        user={{
          ...session.user,
          role: session.user.role,
        }}
      />
    );
  }

  return (
    <Button asChild size="sm" className="gap-2">
      <Link href="/auth/signin">
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    </Button>
  );
};
