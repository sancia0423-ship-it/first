import { z } from "zod";
import { MockActionSchema } from "@/lib/api/contracts";
import { SearchResultSchema } from "@/lib/schemas";
import {
  YouTubeTranscriptResultSchema,
  YouTubeTranslationRequestSchema,
  YouTubeTranslationResultSchema
} from "@/lib/youtube-agent/contracts";

/**
 * The OpenAPI document is generated from the same zod schemas the routes
 * validate against, so the published contract cannot drift from the code.
 */
type JsonSchema = Record<string, unknown>;

function toSchema(schema: z.ZodType, io: "input" | "output"): JsonSchema {
  const generated = z.toJSONSchema(schema, { io, target: "draft-2020-12" }) as JsonSchema;

  // OpenAPI supplies its own dialect; a nested $schema key confuses tooling.
  delete generated.$schema;
  return generated;
}

function jsonBody(schema: JsonSchema, required = true) {
  return {
    required,
    content: { "application/json": { schema } }
  };
}

function jsonResponse(description: string, schema: JsonSchema) {
  return {
    description,
    content: { "application/json": { schema } }
  };
}

const errorSchema: JsonSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    details: {}
  },
  required: ["error"]
};

const commonErrors = {
  "400": jsonResponse("请求参数不合法", errorSchema),
  "401": jsonResponse("缺少或无效的 API key", errorSchema),
  "429": jsonResponse("触发限流", errorSchema),
  "502": jsonResponse("上游依赖失败", errorSchema)
};

export function buildOpenApiDocument(serverUrl?: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Sancia Tools API",
      version: "1.0.0",
      description:
        "个人站点公开 API：YouTube 字幕中文翻译、公开面经检索简报、AI 产品模拟面试。\n" +
        "所有接口在未配置 OPENAI_API_KEY 时仍可运行，只是会退回规则/本地翻译模式。"
    },
    servers: [{ url: serverUrl ?? "/", description: "Deployment root" }],
    tags: [
      { name: "system", description: "健康检查" },
      { name: "youtube", description: "YouTube 字幕翻译" },
      { name: "interview", description: "面经检索与模拟面试" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "在 API_KEYS 环境变量配置后生效；未配置时接口开放访问。"
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/v1/health": {
        get: {
          tags: ["system"],
          summary: "服务健康状态与能力探测",
          security: [],
          responses: {
            "200": jsonResponse("服务可用", {
              type: "object",
              properties: {
                ok: { type: "boolean" },
                service: { type: "string" },
                version: { type: "string" },
                authRequired: { type: "boolean" },
                aiEnhanced: {
                  type: "boolean",
                  description: "true 表示已配置 OpenAI key，会走增强模式。"
                },
                timestamp: { type: "string", format: "date-time" }
              },
              required: ["ok", "service", "version", "authRequired", "aiEnhanced"]
            })
          }
        }
      },
      "/api/v1/youtube/translate": {
        post: {
          tags: ["youtube"],
          summary: "读取公开视频字幕并翻译成简体中文",
          description:
            "支持 watch / shorts / embed / youtu.be 链接。返回逐条时间轴字幕、可下载的 SRT，" +
            "配置 OpenAI key 后还会附带摘要与重点速览。",
          requestBody: jsonBody(toSchema(YouTubeTranslationRequestSchema, "input")),
          responses: {
            "200": jsonResponse("翻译完成", toSchema(YouTubeTranslationResultSchema, "output")),
            ...commonErrors
          }
        }
      },
      "/api/v1/youtube/transcript": {
        post: {
          tags: ["youtube"],
          summary: "只读取公开视频字幕原文，不做翻译",
          description:
            "抓字幕需要服务端能力，但不需要任何 AI key。自带 key 的客户端可以取走原文自行翻译。",
          requestBody: jsonBody(toSchema(YouTubeTranslationRequestSchema, "input")),
          responses: {
            "200": jsonResponse("字幕读取完成", toSchema(YouTubeTranscriptResultSchema, "output")),
            ...commonErrors
          }
        }
      },
      "/api/v1/interview/briefing": {
        get: {
          tags: ["interview"],
          summary: "按公司 / 岗位 / 方向生成结构化面经简报",
          parameters: [
            {
              name: "company",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 1 },
              example: "字节跳动"
            },
            {
              name: "role",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 1 },
              example: "产品经理实习"
            },
            {
              name: "direction",
              in: "query",
              required: false,
              schema: { type: "string" },
              example: "增长"
            }
          ],
          responses: {
            "200": jsonResponse("简报生成完成", toSchema(SearchResultSchema, "output")),
            ...commonErrors
          }
        }
      },
      "/api/v1/interview/mock": {
        post: {
          tags: ["interview"],
          summary: "AI 产品模拟面试：出题 / 逐题点评 / 整场总结",
          description:
            "用 action 区分三个阶段：start 生成一场面试，evaluate 点评单题回答，summary 汇总整场表现。",
          requestBody: jsonBody(toSchema(MockActionSchema, "input")),
          responses: {
            "200": jsonResponse(
              "对应 action 的结果：session / evaluation / summary",
              { type: "object", additionalProperties: true }
            ),
            ...commonErrors
          }
        }
      }
    }
  };
}
