import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 留言表。
 *
 * 只有配置了 NEXT_PUBLIC_FORMSPREE_ID 才渲染表单 —— 没有接收端的表单比没有表单
 * 更糟：访客填完点提交，以为你收到了，其实消息进了虚空。没配就退成邮箱直达。
 *
 * 用原生 form 直接 POST 给 Formspree，不需要 JS：禁用脚本、网络差、浏览器老旧
 * 都照样能提交。
 */
const formId = process.env.NEXT_PUBLIC_FORMSPREE_ID;

export function ContactForm() {
  const { contact } = personalSiteContent.home;

  if (!formId) {
    return (
      <div className="contact-fallback">
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </div>
    );
  }

  return (
    <form
      action={`https://formspree.io/f/${formId}`}
      className="contact-form"
      method="POST"
    >
      <h3 className="contact-form-title">留言表</h3>

      <label>
        Name
        <input name="name" required type="text" />
      </label>

      <label>
        Email address / 电话
        <input name="email" required type="text" />
      </label>

      <label>
        Leave a message
        <textarea name="message" required rows={4} />
      </label>

      <button className="contact-submit" type="submit">
        Submit
      </button>
    </form>
  );
}
