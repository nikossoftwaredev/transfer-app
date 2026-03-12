import { getServerSession } from "next-auth";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SigninForm } from "@/components/auth/signin-form";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "@/lib/i18n/navigation";

const ROLE_ROUTES: Record<string, string> = {
  client: "/book",
  driver: "/driver",
  orgadmin: "/org",
  superadmin: "/admin",
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

const SigninPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  const { callbackUrl, error } = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = session.user.role || "client";
    const dest = callbackUrl || ROLE_ROUTES[role] || "/";
    redirect({ href: dest, locale });
  }

  const t = await getTranslations("Auth.signin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <SigninForm
        callbackUrl={callbackUrl}
        error={error}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          googleButton: t("googleButton"),
          or: t("or"),
          driverLink: t("driverLink"),
          terms: t("terms"),
        }}
      />
    </div>
  );
};

export default SigninPage;
