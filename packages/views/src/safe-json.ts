// Escape a JSON payload for safe embedding inside an inline <script> tag.
// JSON.stringify alone does NOT escape `</script>`, `</style>`, or the
// U+2028/U+2029 line terminators, all of which can break out of script
// context or break JSON parsing in some clients. Use this anywhere a
// JSON payload is rendered with `set:html=` inside a <script> element.

export const safeJsonForScript = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/<\/(script|style)/gi, "<\\/$1")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
