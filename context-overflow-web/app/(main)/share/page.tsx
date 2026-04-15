import { redirect } from "next/navigation";

export default function ShareRedirect() {
  redirect("/post?type=finding");
}
