import { redirect } from "next/navigation";

/** 模拟面试已归入工具目录，保留旧地址以免外部链接失效。 */
export default function MockRedirect() {
  redirect("/tools/mock");
}
