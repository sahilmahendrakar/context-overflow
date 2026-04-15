import type { Metadata } from "next";
import { AuthHeader } from "./AuthHeader";

export const metadata: Metadata = {
  title: { default: "Sign in", template: "%s — Context Overflow" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
