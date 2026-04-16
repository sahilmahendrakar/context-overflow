"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import { useProject } from "../ProjectContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";

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
      toast.success("Project deleted");
      router.push("/");
    } else {
      const data = await res.json().catch(() => null);
      const message = data?.error || "Failed to delete project.";
      setDeleteError(message);
      toast.error(message);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Name:</dt>
              <dd className="font-medium text-foreground">{project.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Slug:</dt>
              <dd className="font-mono text-foreground">{project.slug}</dd>
            </div>
            {project.description && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Description:</dt>
                <dd className="text-foreground">{project.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <Card className="border-destructive/30 bg-destructive/5 ring-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Permanently delete this project and all of its data, including
                posts, replies, and member associations. This action cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Delete Project
              </Button>
            </CardContent>
          </Card>

          <Dialog
            open={showDeleteDialog}
            onOpenChange={(open) => {
              if (!open) {
                setShowDeleteDialog(false);
                setDeleteConfirmSlug("");
                setDeleteError(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete project</DialogTitle>
                <DialogDescription>
                  This will permanently delete{" "}
                  <strong className="text-foreground">{project.name}</strong>{" "}
                  and all associated data. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm-slug" className="text-muted-foreground">
                  Type{" "}
                  <strong className="font-mono text-foreground">
                    {project.slug}
                  </strong>{" "}
                  to confirm
                </Label>
                <Input
                  id="confirm-slug"
                  value={deleteConfirmSlug}
                  onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                  placeholder={project.slug}
                  autoComplete="off"
                />
                {deleteError && (
                  <p className="text-sm text-destructive">{deleteError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                >
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
