import { compactDisplayText } from "@/lib/prompt-display";

export function shortPublicModelName(value?: string) {
  const normalized = compactDisplayText(value || "");
  if (!normalized) {
    return "";
  }

  const doubaoSeedMatch = normalized.match(/^doubao-seed-(\d+)-(\d+)(?:-[a-z0-9._-]+)?$/i);
  if (doubaoSeedMatch) {
    return `doubao-seed-${doubaoSeedMatch[1]}.${doubaoSeedMatch[2]}`;
  }

  const matched = normalized.match(
    /(gpt-[a-z0-9._-]+|gemini-[a-z0-9._-]+|glm-[a-z0-9._-]+|qwen[a-z0-9._-]*|kimi-[a-z0-9._-]+|doubao-[a-z0-9._-]+|minimax-[a-z0-9._-]+|hunyuan-[a-z0-9._-]+|claude-[a-z0-9._-]+|deepseek-[a-z0-9._-]+|llama[a-z0-9._-]*)/i
  );

  if (matched) {
    return matched[1];
  }

  const slashSegments = normalized.split("/").map((segment) => segment.trim()).filter(Boolean);
  if (slashSegments.length > 1) {
    return slashSegments[slashSegments.length - 1];
  }

  return normalized;
}
