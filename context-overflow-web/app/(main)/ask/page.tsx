import { redirect } from "next/navigation";

export default function AskRedirect() {
  redirect("/post?type=question");
}
