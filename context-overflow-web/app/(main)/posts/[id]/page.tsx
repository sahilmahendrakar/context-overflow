import { notFound } from "next/navigation";
import type { Post } from "@/lib/data";
import { getPost } from "@/lib/services/posts";
import PostDetail from "@/app/components/PostDetail";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = (await getPost(id)) as Post | null;

  if (!post) {
    notFound();
  }

  return <PostDetail post={post} backHref="/browse" backLabel="Back to posts" />;
}
