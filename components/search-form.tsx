"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SearchFormProps = {
  initialValues?: {
    company?: string;
    role?: string;
    direction?: string;
  };
};

const quickExamples = [
  {
    label: "字节 / 产品经理实习 / 增长",
    values: { company: "字节跳动", role: "产品经理实习", direction: "增长" }
  },
  {
    label: "美团 / 产品经理实习 / 商业分析",
    values: { company: "美团", role: "产品经理实习", direction: "商业分析" }
  },
  {
    label: "腾讯 / 产品运营实习 / 内容策略",
    values: { company: "腾讯", role: "产品运营实习", direction: "内容策略" }
  }
];

export function SearchForm({ initialValues }: SearchFormProps) {
  const router = useRouter();
  const [company, setCompany] = useState(initialValues?.company ?? "");
  const [role, setRole] = useState(initialValues?.role ?? "");
  const [direction, setDirection] = useState(initialValues?.direction ?? "");
  const [isPending, startTransition] = useTransition();

  const submit = (nextCompany = company, nextRole = role, nextDirection = direction) => {
    const params = new URLSearchParams();
    params.set("company", nextCompany);
    params.set("role", nextRole);
    if (nextDirection.trim()) {
      params.set("direction", nextDirection);
    }

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  const canSubmit = company.trim().length > 0 && role.trim().length > 0;

  return (
    <div className="search-form">
      <div className="search-grid">
        <label>
          公司
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="例如：字节跳动"
          />
        </label>

        <label>
          岗位
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="例如：产品经理实习"
          />
        </label>

        <label>
          方向
          <input
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
            placeholder="例如：增长 / 商业分析 / 内容策略"
          />
        </label>
      </div>

      <div className="button-row">
        <button
          className="primary-button"
          disabled={!canSubmit || isPending}
          onClick={() => submit()}
          type="button"
        >
          {isPending ? "分析中..." : "开始分析"}
        </button>
        <span className="muted form-helper">这一版会优先拉取牛客和掘金的公开内容，输出更适合面前快速准备的结构化总结；如果网络侧失败，系统才会回退到演示样本。</span>
      </div>

      <div className="example-block">
        <p className="example-label">常用查询</p>
        <div className="chip-row">
        {quickExamples.map((example) => (
          <button
            className="chip"
            key={example.label}
            onClick={() => {
              setCompany(example.values.company);
              setRole(example.values.role);
              setDirection(example.values.direction);
              submit(example.values.company, example.values.role, example.values.direction);
            }}
            type="button"
          >
            {example.label}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
