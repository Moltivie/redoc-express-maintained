import { escapeJsString, escapeScriptTagContent } from '../src/escape';

describe('escape', () => {
  describe('escapeJsString', () => {
    it('should escape double quotes', () => {
      expect(escapeJsString('hello"world')).toBe('hello\\"world');
      expect(escapeJsString('"; alert(1); //')).toBe('\\"; alert(1); //');
    });

    it('should escape backslashes', () => {
      expect(escapeJsString('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should escape newline, carriage return, tab', () => {
      expect(escapeJsString('a\nb')).toBe('a\\nb');
      expect(escapeJsString('a\rb')).toBe('a\\rb');
      expect(escapeJsString('a\tb')).toBe('a\\tb');
    });

    it('should escape other control characters', () => {
      expect(escapeJsString('a\x00b')).toBe('a\\x00b');
      expect(escapeJsString('\u001f')).toBe('\\x1f');
    });

    it('should leave safe URL characters unchanged', () => {
      const url = '/api/spec?v=1.0&format=json';
      expect(escapeJsString(url)).toBe(url);
    });

    it('should handle empty string', () => {
      expect(escapeJsString('')).toBe('');
    });
  });

  describe('escapeScriptTagContent', () => {
    it('should replace </script> with \\u003c/script>', () => {
      expect(escapeScriptTagContent('foo</script>bar')).toBe(
        'foo\\u003c/script>bar'
      );
    });

    it('should preserve case so the runtime value is unchanged', () => {
      expect(escapeScriptTagContent('</SCRIPT>')).toBe('\\u003c/SCRIPT>');
    });

    it('should replace multiple occurrences', () => {
      expect(escapeScriptTagContent('</script>x</script>')).toBe(
        '\\u003c/script>x\\u003c/script>'
      );
    });

    it.each(['</script >', '</script/x>', '</SCRIPT\t>', '<!--<script>'])(
      'should neutralize every closing-tag or comment variant: %j',
      (input) => {
        expect(escapeScriptTagContent(input)).not.toContain('<');
      }
    );

    it('should leave content without < unchanged', () => {
      expect(escapeScriptTagContent('{"key":"value"}')).toBe('{"key":"value"}');
    });
  });
});
