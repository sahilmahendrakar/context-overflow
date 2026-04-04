import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { getSession } from "@/lib/session";
import { getProjectBySlug } from "@/lib/services/projects";
import { ProjectProvider } from "./ProjectContext";
import { SetActiveProject } from "./SetActiveProject";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const membership = session.memberships[slug];
  if (!membership) {
    redirect("/");
  }

  const project = await getProjectBySlug(slug);
  if (!project) {
    redirect("/");
  }

  const projectValue = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    inviteCode: project.inviteCode,
    role: membership.role,
  };

  return (
    <ProjectProvider value={projectValue}>
      <SetActiveProject id={project.id} slug={project.slug} name={project.name} />
      {children}
    </ProjectProvider>
  );
}
