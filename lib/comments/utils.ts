const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;
const URL_REGEX = /(https?:\/\/[^\s)]+)(?![^<]*>)/gi;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const applyInlineFormatting = (input: string) =>
  input
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*(?!\s)([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a class="text-primary underline" target="_blank" rel="noreferrer" href="$2">$1</a>');

export const createMentionToken = (name: string, id: string) => `@[${name}](${id})`;

export const extractMentionIds = (content: string): string[] => {
  if (!content) return [];
  const ids = new Set<string>();
  for (const match of content.matchAll(MENTION_REGEX)) {
    const userId = match[2];
    if (userId) ids.add(userId);
  }
  return Array.from(ids);
};

export const formatCommentContent = (content: string, mentionMap: Record<string, { name: string }> = {}): string => {
  if (!content) return "";
  const escaped = escapeHtml(content);
  const withMentions = escaped.replace(MENTION_REGEX, (_match, label: string, id: string) => {
    const resolved = mentionMap[id]?.name ?? label;
    return `<span class="text-primary font-medium" data-mention-id="${id}">@${resolved}</span>`;
  });
  const withLinks = withMentions.replace(URL_REGEX, (url) => `<a class="text-primary underline" href="${url}" target="_blank" rel="noreferrer">${url}</a>`);
  const formatted = applyInlineFormatting(withLinks);
  return formatted.replace(/\n/g, "<br />");
};

export const sanitizeCommentBody = (input: string) => {
  if (!input) return "";
  return input.trim().slice(0, 5000);
};

export { MENTION_REGEX };
