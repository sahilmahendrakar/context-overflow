import { notFound } from "next/navigation";
import type { Post } from "@/lib/data";
import { getPost } from "@/lib/services/posts";
import PostDetail from "@/app/components/PostDetail";

export default async function ProjectPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const post = (await getPost(id)) as Post | null;

  if (!post) {
    notFound();
  }

  return (
    <PostDetail post={post} backHref={`/p/${slug}`} backLabel="Back to project" />
  );
}
