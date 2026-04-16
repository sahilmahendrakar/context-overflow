import { Badge } from "@/components/ui/badge";

export default function Tag({ name }: { name: string }) {
  return <Badge variant="neutral">{name}</Badge>;
}
