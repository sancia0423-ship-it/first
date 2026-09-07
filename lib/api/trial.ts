import "server-only";

import { hasOpenAIKey } from "@/lib/config";
import { getClientKey } from "@/lib/pipeline/rate-limit";

/**
 * 试用额度：让没有自带 key 的访客也能一键看到完整效果。
 *
 * 为什么需要：自带 key 在技术上是对的（成本归零、key 不经过服务器），但它把
 * 门槛推给了用户 —— 第一次来的人不会为了试一个工具去注册 OpenAI。试用额度用
 * 站长自己的 key 补上这一段，代价用三重上限封死。
 *
 * 计数存在进程内存里：重启即清零，多实例也不共享。对当前规模够用；真要扩到
 * 多实例，这里换成 Redis 即可，接口不用变。
 */

function readNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** 单个 IP 每天可以试用几次。 */
const PER_IP_DAILY = readNumber("TRIAL_PER_IP_DAILY", 3);
/**
 * 全站每天总次数 —— 这一条才是支出的硬上限。
 *
 * 单次成本按端点不同：字幕翻译约 $0.003（有条数上限），模拟面试出题约 $0.02，
 * 面经抽取约 $0.05（要抽取四篇正文，是最贵的一个）。按最贵的算，60 次约 $3/天。
 */
const TOTAL_DAILY = readNumber("TRIAL_TOTAL_DAILY", 60);
/** 试用最多翻译多少条字幕，用来封死单次成本。 */
export const TRIAL_MAX_SEGMENTS = readNumber("TRIAL_MAX_SEGMENTS", 150);

const perIp = new Map<string, number>();
let totalToday = 0;
let currentDay = "";

/** UTC 日期，用作配额窗口。 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function rollOver() {
  const day = today();
  if (day !== currentDay) {
    currentDay = day;
    totalToday = 0;
    perIp.clear();
  }
}

export function isTrialAvailable() {
  return hasOpenAIKey() && TOTAL_DAILY > 0 && PER_IP_DAILY > 0;
}

export type TrialStatus = {
  /** 这个站点是否开放了试用（配了 key 且额度大于 0）。 */
  enabled: boolean;
  /** 此刻这个访客还能不能用。enabled 为真但 available 为假 = 今天用完了。 */
  available: boolean;
  remaining: number;
  maxSegments: number;
};

export function getTrialStatus(request: { headers: Headers }): TrialStatus {
  if (!isTrialAvailable()) {
    return { enabled: false, available: false, remaining: 0, maxSegments: TRIAL_MAX_SEGMENTS };
  }

  rollOver();

  const used = perIp.get(getClientKey(request)) ?? 0;
  const remaining = Math.max(
    0,
    Math.min(PER_IP_DAILY - used, TOTAL_DAILY - totalToday)
  );

  return { enabled: true, available: remaining > 0, remaining, maxSegments: TRIAL_MAX_SEGMENTS };
}

/**
 * 占用一次配额。返回 false 表示已用尽，调用方应当拒绝并提示自带 key。
 * 先占用再执行：宁可失败时浪费一次额度，也不要并发时超支。
 */
export function consumeTrial(request: { headers: Headers }): boolean {
  if (!isTrialAvailable()) {
    return false;
  }

  rollOver();

  const key = getClientKey(request);
  const used = perIp.get(key) ?? 0;

  if (used >= PER_IP_DAILY || totalToday >= TOTAL_DAILY) {
    return false;
  }

  perIp.set(key, used + 1);
  totalToday += 1;
  return true;
}
