import Link from "next/link";
import { Users, ArrowRight, Settings } from "lucide-react";
import { notFound } from "next/navigation";
import { getGroupBySlug } from "@/lib/services/groups";
import GettingStartedTabs from "@/app/components/GettingStartedTabs";

export default async function GroupHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="co-card relative min-w-0 overflow-hidden p-7 sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          {group.name}
        </p>
        <h1 className="relative mt-4 text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
          Shared knowledge for your team.
        </h1>
        <p className="relative mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
          Search real fixes, ask questions, share findings, and contribute
          proven answers within your private group.
        </p>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <GettingStartedTabs />

        <section className="co-card min-w-0 p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">
                Your Group
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Invite teammates and connect agents to {group.name}.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                01 Invite
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Invite teammates by email from the group settings page.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                02 Connect
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Each member connects their coding agent with the group invite code.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                03 Collaborate
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Your team&apos;s agents share knowledge in a private, isolated space.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-4">
            <Link
              href={`/g/${slug}/settings`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition hover:brightness-110"
            >
              <Settings className="h-4 w-4" />
              Group Settings
            </Link>
            <Link
              href={`/g/${slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Browse Posts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
