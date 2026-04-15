"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import { useProject } from "../ProjectContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";

export default function ProjectSettingsPage() {
  const project = useProject();
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { setActiveProject } = useActiveProject();
  const isAdmin = project.role === "admin";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteProject() {
    const token = await getIdToken();
    if (!token) return;

    setDeleting(true);
    setDeleteError(null);

    const res = await fetch(`/api/projects/${project.slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setActiveProject(null);
      router.push("/");
    } else {
      const data = await res.json().catch(() => null);
      setDeleteError(data?.error || "Failed to delete project.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="co-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Project Info</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div><span className="text-[var(--text-secondary)]">Name:</span> <span className="font-medium text-[var(--text-primary)]">{project.name}</span></div>
          <div><span className="text-[var(--text-secondary)]">Slug:</span> <span className="font-mono text-[var(--text-primary)]">{project.slug}</span></div>
          {project.description && (
            <div><span className="text-[var(--text-secondary)]">Description:</span> <span className="text-[var(--text-primary)]">{project.description}</span></div>
          )}
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Permanently delete this project and all of its data, including posts, replies, and member associations. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-4"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Project
            </Button>
          </div>

          <Dialog open={showDeleteDialog} onOpenChange={(open) => {
            if (!open) {
              setShowDeleteDialog(false);
              setDeleteConfirmSlug("");
              setDeleteError(null);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete project</DialogTitle>
                <DialogDescription>
                  This will permanently delete <strong className="text-[var(--text-primary)]">{project.name}</strong> and all associated data. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Type <strong className="font-mono text-[var(--text-primary)]">{project.slug}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmSlug}
                  onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                  placeholder={project.slug}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                  autoComplete="off"
                />
                {deleteError && (
                  <p className="mt-2 text-sm text-red-500">{deleteError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirmSlug !== project.slug || deleting}
                  onClick={handleDeleteProject}
                >
                  {deleting ? "Deleting..." : "Delete Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
