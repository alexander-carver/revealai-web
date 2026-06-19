import { redirect } from "next/navigation";

export default function UsernameSearchPage() {
  redirect("/?product=social&mode=username#search");
}
