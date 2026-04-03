export function compactDisplayText(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function excerptDisplayText(value: string, length: number) {
  const text = compactDisplayText(value);
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
}

export function cleanPromptForDisplay(value: string) {
  return compactDisplayText(
    String(value || "")
      .replace(/Refine according to previous suggestion:[\s\S]*$/i, " ")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^\s*\|[-| :]+\|\s*$/gm, " ")
      .replace(/^\s*\|.*\|\s*$/gm, " ")
      .replace(/^\s*#{1,6}\s*/gm, "")
      .replace(/^\s*\*\*?风险等级\*\*?\s*:\s*.*$/gim, " ")
      .replace(/^\s*风险等级\s*:\s*.*$/gim, " ")
      .replace(/\*\*/g, "")
      .replace(/`([^`]+)`/g, "$1")
  );
}
