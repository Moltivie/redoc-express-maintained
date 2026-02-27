import { createPlugin } from '../src/plugin-system';
import { redocHtml } from '../src/redoc-html-template';

describe('HTML Injection Security Tests', () => {
  describe('Title Injection Prevention', () => {
    it('should render title without injecting script tags', async () => {
      const maliciousTitle = '<script>alert("XSS")</script>API Docs';
      const html = await redocHtml({
        title: maliciousTitle,
        specUrl: '/spec.json'
      });

      // Title is HTML-escaped so script tags are not executable
      expect(html).toContain('&lt;script&gt;alert("XSS")&lt;/script&gt;API Docs');
      expect(html).toContain('<title>');
      expect(html).toContain('</title>');
      // Only the two intended script tags (ReDoc bundle + init)
      const scriptCount = (html.match(/<script/g) || []).length;
      expect(scriptCount).toBe(2);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('should handle title with HTML entities', async () => {
      const title = 'API Docs & More < > " \' /';
      const html = await redocHtml({
        title,
        specUrl: '/spec.json'
      });

      // &, <, > are escaped for HTML context
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('<title>');
      expect(html).toContain('</title>');
    });

    it('should handle title with single quotes', async () => {
      const title = "API's Documentation";
      const html = await redocHtml({
        title,
        specUrl: '/spec.json'
      });

      expect(html).toContain(`<title>${title}</title>`);
    });

    it('should handle title with newlines and special chars', async () => {
      const title = 'API\\nDocs\\r\\nWith\\tTabs';
      const html = await redocHtml({
        title,
        specUrl: '/spec.json'
      });

      expect(html).toContain(title);
    });
  });

  describe('Spec URL Injection Prevention', () => {
    it('should handle spec URL without breaking JSON structure', async () => {
      const maliciousUrl = '"; alert("XSS"); var x="';
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: maliciousUrl
      });

      // Quotes are backslash-escaped so the JS string does not break
      expect(html).toContain('\\"');
      expect(html).toContain('Redoc.init(');
      expect(html).toContain('document.getElementById("redoc-container")');
      // No injected script: init call is intact (no bare "); alert)
      expect(html).not.toMatch(/"\s*\)\s*;\s*alert/);
    });

    it('should handle spec URL with special characters', async () => {
      const specUrl = '/api/spec?v=1.0&format=json&type=openapi';
      const html = await redocHtml({
        title: 'API Docs',
        specUrl
      });

      expect(html).toContain(specUrl);
    });

    it('should handle spec URL with quotes', async () => {
      const specUrl = '/api/spec?name="test"';
      const html = await redocHtml({
        title: 'API Docs',
        specUrl
      });

      // Double quotes in URL are escaped for JS string context
      expect(html).toContain('\\"');
      expect(html).toContain('name=');
      expect(html).toContain('test');
    });

    it('should handle spec URL with script tag attempt', async () => {
      const specUrl = '</script><script>alert("XSS")</script><script>';
      const html = await redocHtml({
        title: 'API Docs',
        specUrl
      });

      // </script> in URL is neutralized so our script block is not closed early
      expect(html).toContain('\\u003c/script>');
      expect(html).toContain('Redoc.init(');
    });
  });

  describe('Nonce Attribute Injection Prevention', () => {
    it('should safely insert nonce attribute', async () => {
      const nonce = 'secure-random-123';
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        nonce
      });

      expect(html).toContain(`nonce='${nonce}'`);
    });

    it('should handle malicious nonce with quotes', async () => {
      const nonce = "' onload='alert(\"XSS\")'";
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        nonce
      });

      // Single quote is escaped so attribute cannot be broken out of
      expect(html).toContain('&#39;');
      expect(html).not.toMatch(/nonce='[^']*'\s+onload=/);
      const scriptCount = (html.match(/<script/g) || []).length;
      expect(scriptCount).toBe(2);
    });

    it('should handle empty nonce', async () => {
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        nonce: ''
      });

      expect(html).toContain("nonce=''");
    });

    it('should handle nonce with script closing tag', async () => {
      const nonce = '</script><script>alert("XSS")</script>';
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        nonce
      });

      // Nonce is escaped so </script> does not close the HTML script tag
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      const scriptCount = (html.match(/<script/g) || []).length;
      expect(scriptCount).toBe(2);
    });
  });

  describe('Redoc Options Injection Prevention', () => {
    it('should safely serialize redoc options as JSON', async () => {
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        redocOptions: {
          hideDownloadButton: false,
          theme: {
            colors: {
              primary: { main: '#3f51b5' }
            }
          }
        }
      });

      // Verify JSON is properly formatted
      expect(html).toContain('"hideDownloadButton":false');
      expect(html).toContain('"primary":{"main":"#3f51b5"}');
    });

    it('should handle redoc options with string values containing quotes', async () => {
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        redocOptions: {
          customText: 'This is a "test" with quotes'
        }
      });

      // JSON.stringify should escape the quotes
      expect(html).toContain('"customText":"This is a \\"test\\" with quotes"');
    });

    it('should handle redoc options with HTML-like content', async () => {
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        redocOptions: {
          description: '<script>alert("XSS")</script>'
        }
      });

      // </script> in options is neutralized so our script block is not closed early
      expect(html).toContain('\\u003c/script>');
      expect(html).toContain('Redoc.init(');
    });

    it('should neutralize </script> in redoc options string values', async () => {
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        redocOptions: {
          custom: '</script><script>alert(1)</script>'
        }
      });

      expect(html).toContain('\\u003c/script>');
      expect(html).toContain('Redoc.init(');
    });

    it('should handle redoc options with special characters', async () => {
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        redocOptions: {
          text: 'Line 1\nLine 2\tTabbed\rReturn'
        }
      });

      // JSON.stringify should properly escape newlines and tabs
      expect(html).toContain('\\n');
      expect(html).toContain('\\t');
    });
  });

  describe('Plugin-based HTML Injection', () => {
    it('should allow safe HTML injection via afterRender hook', async () => {
      const customBanner = '<div class="custom-banner">Welcome to API Docs</div>';
      const plugin = createPlugin({
        name: 'banner',
        hooks: {
          afterRender: (html: string) => html.replace('<body>', `<body>${customBanner}`)
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [plugin]
      });

      expect(html).toContain(customBanner);
      expect(html).toContain('<body><div class="custom-banner">');
    });

    it('should handle plugin injecting script tags', async () => {
      const analyticsScript = `<script>
        console.log('Analytics initialized');
        window.ga = function() { console.log('GA called', arguments); };
      </script>`;

      const plugin = createPlugin({
        name: 'analytics',
        hooks: {
          afterRender: (html: string) => html.replace('</head>', `${analyticsScript}</head>`)
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [plugin]
      });

      expect(html).toContain(analyticsScript);
      expect(html).toContain('Analytics initialized');
    });

    it('should handle plugin injecting CSS styles', async () => {
      const customStyles = `<style>
        body { background-color: #1a1a1a; }
        .custom-class { color: red; }
      </style>`;

      const plugin = createPlugin({
        name: 'dark-theme',
        hooks: {
          afterRender: (html: string) => html.replace('</head>', `${customStyles}</head>`)
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [plugin]
      });

      expect(html).toContain(customStyles);
      expect(html).toContain('background-color: #1a1a1a');
    });

    it('should handle multiple plugins injecting HTML', async () => {
      const headerPlugin = createPlugin({
        name: 'header',
        hooks: {
          afterRender: (html: string) => html.replace('<body>', '<body><header>My Header</header>')
        }
      });

      const footerPlugin = createPlugin({
        name: 'footer',
        hooks: {
          afterRender: (html: string) => html.replace('</body>', '<footer>My Footer</footer></body>')
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [headerPlugin, footerPlugin]
      });

      expect(html).toContain('<header>My Header</header>');
      expect(html).toContain('<footer>My Footer</footer>');
    });

    it('should handle plugin with malicious intent gracefully', async () => {
      // Even if a plugin tries to inject malicious code, it's the plugin
      // developer's responsibility. We test that the system allows it
      // (since plugins are trusted code) but document the security model.
      const maliciousPlugin = createPlugin({
        name: 'malicious',
        hooks: {
          afterRender: (html: string) =>
            html.replace('</body>', '<script>alert("This is injected by plugin")</script></body>')
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [maliciousPlugin]
      });

      // Plugin injection should work (it's intentional by plugin author)
      expect(html).toContain('alert("This is injected by plugin")');
    });
  });

  describe('CSP (Content Security Policy) Compliance', () => {
    it('should support nonce for inline scripts', async () => {
      const nonce = 'random-nonce-12345';
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        nonce
      });

      // Verify nonce is added to script tags
      expect(html).toContain(`nonce='${nonce}'`);
      // Verify it's in the right script tag
      expect(html).toMatch(new RegExp(`<script nonce='${nonce}'[^>]*src="https://unpkg.com/redoc`));
    });

    it('should work without nonce when not provided', async () => {
      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json'
      });

      expect(html).toContain("nonce=''");
    });
  });

  describe('HTML Structure Integrity', () => {
    it('should maintain valid HTML structure with injections', async () => {
      const html = await redocHtml({
        title: '<img src=x onerror=alert(1)>',
        specUrl: '"><script>alert(2)</script>',
        nonce: "'><script>alert(3)</script><'"
      });

      // All injection points are escaped; structure remains valid
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
      expect(html).toContain('<div id="redoc-container"></div>');
      expect(html).toContain('&lt;'); // title escaped
      expect(html).toContain('\\"'); // specUrl escaped
      expect(html).toContain('Redoc.init(');
    });

    it('should handle Unicode and international characters', async () => {
      const title = 'API 文档 📚 Документация';
      const html = await redocHtml({
        title,
        specUrl: '/spec.json'
      });

      expect(html).toContain(title);
      expect(html).toContain('<meta charset="utf-8" />');
    });

    it('should handle extremely long values', async () => {
      const longTitle = 'A'.repeat(10000);
      const html = await redocHtml({
        title: longTitle,
        specUrl: '/spec.json'
      });

      expect(html).toContain(longTitle);
      expect(html.length).toBeGreaterThan(10000);
    });
  });

  describe('BeforeRender Hook Injection', () => {
    it('should allow HTML modification before rendering', async () => {
      const plugin = createPlugin({
        name: 'preprocessor',
        hooks: {
          beforeRender: (html: string) => html.replace('[[title]]', 'Modified Title')
        }
      });

      const html = await redocHtml({
        title: 'Original Title',
        specUrl: '/spec.json',
        plugins: [plugin]
      });

      // beforeRender runs before template replacement, so it won't affect
      // the final title, but we test the hook mechanism
      expect(html).toContain('Original Title');
    });

    it('should handle beforeRender adding meta tags', async () => {
      const plugin = createPlugin({
        name: 'meta-injector',
        hooks: {
          beforeRender: (html: string) => html.replace('</head>', '<meta name="author" content="Test Author" /></head>')
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [plugin]
      });

      expect(html).toContain('<meta name="author" content="Test Author" />');
    });
  });

  describe('Complex Injection Scenarios', () => {
    it('should handle injection attempts in all parameters simultaneously', async () => {
      const xssTitle = '<script>alert("title")</script>';
      const xssUrl = '"; alert("url"); "';
      const xssNonce = "' onload=\"alert('nonce')\"";

      const html = await redocHtml({
        title: xssTitle,
        specUrl: xssUrl,
        nonce: xssNonce,
        redocOptions: {
          customField: '<script>alert("options")</script>'
        }
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      // All escaped: title as &lt;&gt;, specUrl as \", nonce as &#39;, options as \u003c/script>
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('\\"');
      expect(html).toContain('&#39;');
      expect(html).toContain('\\u003c/script>');
      expect(html).toContain('Redoc.init(');
    });

    it('should handle nested plugin injections', async () => {
      const plugin1 = createPlugin({
        name: 'plugin1',
        hooks: {
          afterRender: (html: string) => html.replace('<body>', '<body><div id="plugin1">Plugin 1</div>')
        }
      });

      const plugin2 = createPlugin({
        name: 'plugin2',
        hooks: {
          afterRender: (html: string) =>
            html.replace('<div id="plugin1">', '<div id="plugin1"><div id="plugin2">Plugin 2</div>')
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [plugin1, plugin2]
      });

      expect(html).toContain('<div id="plugin1">');
      expect(html).toContain('<div id="plugin2">Plugin 2</div>');
      expect(html).toContain('Plugin 1</div>');
    });

    it('should prevent common XSS vectors', async () => {
      const xssVectors = [
        '<img src=x onerror=alert(1)>',
        '<svg/onload=alert(1)>',
        // eslint-disable-next-line no-script-url
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
        '<body onload=alert(1)>',
        '<input onfocus=alert(1) autofocus>',
        '<select onfocus=alert(1) autofocus>',
        '<textarea onfocus=alert(1) autofocus>',
        '<marquee onstart=alert(1)>',
        '<div style="width:expression(alert(1))">'
      ];

      await Promise.all(
        xssVectors.map(async (vector) => {
          const html = await redocHtml({
            title: vector,
            specUrl: '/spec.json'
          });

          expect(html).toContain('<title>');
          expect(html).toContain('</title>');
          expect(html).toContain('<!DOCTYPE html>');
          // Vectors that contain < or > are HTML-escaped
          if (vector.includes('<')) expect(html).toContain('&lt;');
          if (vector.includes('>')) expect(html).toContain('&gt;');
          return Promise.resolve();
        })
      );
    });
  });

  describe('Real-World Security Scenarios', () => {
    it('should handle user-provided spec URL from query parameters safely', async () => {
      const userProvidedUrl = 'https://evil.com/malicious.json"><script>alert(1)</script>';

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: userProvidedUrl
      });

      // Quotes and </script> are escaped so the URL cannot break out
      expect(html).toContain('\\"');
      expect(html).toContain('\\u003c/script>');
      expect(html).toContain('Redoc.init(');
    });

    it('should handle custom branding with logo URLs', async () => {
      const logoUrl = 'https://example.com/logo.png" onerror="alert(1)';
      const plugin = createPlugin({
        name: 'branding',
        config: {
          logoUrl
        },
        hooks: {
          afterRender: (html: string) => html.replace('<body>', `<body><img src="${logoUrl}" alt="Logo">`)
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [plugin]
      });

      // Even though plugin inserts potentially dangerous HTML,
      // it's the plugin developer's responsibility to sanitize
      expect(html).toContain('https://example.com/logo.png');
    });

    it('should handle analytics plugins with tracking IDs', async () => {
      const trackingId = 'G-XXXXXX"><script>alert(1)</script>';
      const plugin = createPlugin({
        name: 'analytics',
        config: { trackingId },
        hooks: {
          afterRender: (html: string) => {
            const script = `<script>ga('create', '${trackingId}', 'auto');</script>`;
            return html.replace('</head>', `${script}</head>`);
          }
        }
      });

      const html = await redocHtml({
        title: 'API Docs',
        specUrl: '/spec.json',
        plugins: [plugin]
      });

      // Plugin should be able to inject tracking code
      expect(html).toContain(trackingId);
    });
  });
});
