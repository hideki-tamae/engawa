import { redirect } from "next/navigation";

/** 英語版の入口。 https://…/en  */
export default function Page() {
  redirect("/?lang=en");
}
