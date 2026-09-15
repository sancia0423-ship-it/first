import { redirect } from "next/navigation";

/** 项目展示已并入自我介绍页（设计稿里它们本来就是同一页的上下两屏）。 */
export default function ProjectsRedirect() {
  redirect("/about#projects");
}
