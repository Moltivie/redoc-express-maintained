/**
 * Minimal escape helpers for contexts the xss package does not cover
 * (JavaScript string literal content and </script> in script block body).
 */

/**
 * Escapes a string for safe use inside a double-quoted JavaScript string.
 * Backslash-escapes \ and ", and common control characters.
 */
export function escapeJsString(s: string): string {
  const out = s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  // Replace remaining control chars (no-control-regex: avoid \u0000-\u001f in regex)
  let result = '';
  for (let i = 0; i < out.length; i += 1) {
    const c = out[i];
    const code = c.charCodeAt(0);
    if (code <= 31) {
      result += code <= 0x0f ? `\\x0${code.toString(16)}` : `\\x${code.toString(16)}`;
    } else {
      result += c;
    }
  }
  return result;
}

/**
 * Neutralizes the literal sequence </script> in content that will be
 * placed inside a <script> block, so the HTML parser does not close
 * the script tag. At runtime the JS value is unchanged (\u003c is <).
 */
export function escapeScriptTagContent(s: string): string {
  return s.replace(/<\/script>/gi, '\\u003c/script>');
}
