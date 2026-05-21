const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const inputPath = path.join(root, 'bao_cao_du_an.md');
const outputPath = path.join(root, 'bao_cao_du_an.html');

const markdown = fs.readFileSync(inputPath, 'utf8');

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isSeparator(line) {
  return /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

const lines = markdown.split(/\r?\n/);
let html = '';
let i = 0;
let inList = false;

function closeList() {
  if (inList) {
    html += '</ul>\n';
    inList = false;
  }
}

while (i < lines.length) {
  const line = lines[i];

  if (line.trim().startsWith('```')) {
    closeList();
    const lang = line.trim().slice(3).trim();
    const code = [];
    i += 1;
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      code.push(lines[i]);
      i += 1;
    }
    if (lang === 'mermaid') {
      html += `<figure class="diagram"><div class="diagram-label">Biểu đồ</div><div class="mermaid">${escapeHtml(code.join('\n'))}</div></figure>\n`;
    } else {
      html += `<figure class="code-block"><pre><code>${escapeHtml(code.join('\n'))}</code></pre></figure>\n`;
    }
    i += 1;
    continue;
  }

  if (line.trim().startsWith('|') && i + 1 < lines.length && isSeparator(lines[i + 1])) {
    closeList();
    const headers = splitTableRow(line);
    i += 2;
    const rows = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      rows.push(splitTableRow(lines[i]));
      i += 1;
    }
    html += '<div class="table-wrap"><table><thead><tr>';
    html += headers.map((h) => `<th>${inlineFormat(h)}</th>`).join('');
    html += '</tr></thead><tbody>';
    for (const row of rows) {
      html += '<tr>' + row.map((c) => `<td>${inlineFormat(c)}</td>`).join('') + '</tr>';
    }
    html += '</tbody></table></div>\n';
    continue;
  }

  const trimmed = line.trim();
  if (!trimmed || trimmed === '---') {
    closeList();
    if (trimmed === '---') html += '<hr />\n';
    i += 1;
    continue;
  }

  const heading = /^(#{1,4})\s+(.+)$/.exec(line);
  if (heading) {
    closeList();
    const level = heading[1].length;
    const text = heading[2].trim();
    const id = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    html += `<h${level} id="${id}">${inlineFormat(text)}</h${level}>\n`;
    i += 1;
    continue;
  }

  if (trimmed.startsWith('>')) {
    closeList();
    html += `<blockquote>${inlineFormat(trimmed.replace(/^>\s?/, ''))}</blockquote>\n`;
    i += 1;
    continue;
  }

  const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
  if (bullet) {
    if (!inList) {
      html += '<ul>\n';
      inList = true;
    }
    html += `<li>${inlineFormat(bullet[1])}</li>\n`;
    i += 1;
    continue;
  }

  const numbered = /^\d+\.\s+(.+)$/.exec(trimmed);
  if (numbered) {
    closeList();
    const items = [];
    while (i < lines.length) {
      const match = /^\d+\.\s+(.+)$/.exec(lines[i].trim());
      if (!match) break;
      items.push(match[1]);
      i += 1;
    }
    html += '<ol>' + items.map((item) => `<li>${inlineFormat(item)}</li>`).join('') + '</ol>\n';
    continue;
  }

  closeList();
  const paragraph = [trimmed];
  i += 1;
  while (
    i < lines.length &&
    lines[i].trim() &&
    !lines[i].trim().startsWith('|') &&
    !lines[i].trim().startsWith('```') &&
    !/^#{1,4}\s+/.test(lines[i]) &&
    !/^[-*]\s+/.test(lines[i].trim()) &&
    !/^\d+\.\s+/.test(lines[i].trim())
  ) {
    paragraph.push(lines[i].trim());
    i += 1;
  }
  html += `<p>${inlineFormat(paragraph.join(' '))}</p>\n`;
}
closeList();

const doc = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Báo cáo LumiLearn LMS</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #172033;
      background: #f3f6fb;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.55;
    }

    .page {
      max-width: 980px;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 14px 40px rgba(16, 24, 40, 0.08);
    }

    .content {
      padding: 34px 42px 52px;
    }

    h1, h2, h3, h4 {
      color: #0f2747;
      line-height: 1.25;
      letter-spacing: 0;
    }

    h1 {
      margin: 0 0 10px;
      color: #0f2747;
      font-size: 24px;
      display: block;
    }

    h2 {
      margin: 28px 0 12px;
      padding: 9px 12px;
      color: #fff;
      background: #123f6d;
      border-radius: 6px;
      font-size: 18px;
      page-break-after: avoid;
    }

    h3 {
      margin: 22px 0 9px;
      color: #164a7d;
      font-size: 14px;
      border-left: 4px solid #1fb6a6;
      padding-left: 9px;
      page-break-after: avoid;
    }

    h4 {
      margin: 16px 0 8px;
      font-size: 12px;
    }

    p {
      margin: 8px 0;
    }

    blockquote {
      margin: 12px 0 18px;
      padding: 12px 14px;
      border-left: 4px solid #1fb6a6;
      background: #eef9f7;
      color: #24415f;
      border-radius: 0 6px 6px 0;
    }

    hr {
      border: 0;
      height: 1px;
      background: #dbe4f0;
      margin: 18px 0;
    }

    code {
      font-family: "Cascadia Mono", Consolas, monospace;
      background: #eef2f7;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 10px;
      color: #0b4f6c;
    }

    .table-wrap {
      margin: 10px 0 18px;
      overflow: visible;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cfd9e6;
      background: #fff;
      font-size: 9.5px;
    }

    th {
      color: #fff;
      background: #174a7c;
      font-weight: 700;
      text-align: left;
      padding: 6px 7px;
      border: 1px solid #174a7c;
    }

    td {
      vertical-align: top;
      padding: 5px 7px;
      border: 1px solid #d9e2ee;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    ul, ol {
      margin: 7px 0 12px 22px;
      padding: 0;
    }

    li {
      margin: 3px 0;
    }

    .code-block {
      margin: 12px 0 18px;
      page-break-inside: auto;
    }

    .diagram-label {
      display: inline-block;
      margin-bottom: 0;
      padding: 5px 8px;
      color: #fff;
      background: #1b6f85;
      border-radius: 6px 6px 0 0;
      font-weight: 700;
      font-size: 10px;
    }

    pre {
      margin: 0;
      padding: 12px;
      color: #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f4f7fb;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 8.6px;
      line-height: 1.42;
    }

    .diagram pre {
      border-top-left-radius: 0;
      background: #f1fbfb;
      border-color: #a9d9df;
    }

    .mermaid {
      padding: 14px;
      overflow: visible;
      text-align: center;
      background: linear-gradient(180deg, #fbfdff, #f3f9fb);
      border: 1px solid #a9d9df;
      border-radius: 0 6px 6px 6px;
      page-break-inside: auto;
    }

    .mermaid svg {
      max-width: 100%;
      height: auto;
      font-family: "Segoe UI", Arial, sans-serif !important;
    }

    .footer-note {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #dbe4f0;
      color: #64748b;
      font-size: 9px;
      text-align: right;
    }

    @media print {
      body {
        background: #fff;
      }
      .page {
        box-shadow: none;
      }
      h2 {
        break-after: avoid;
      }
      figure {
        break-inside: auto;
      }
      .table-wrap {
        break-inside: auto;
      }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      if (window.mermaid) {
        window.mermaid.initialize({
          startOnLoad: true,
          securityLevel: 'loose',
          theme: 'base',
          flowchart: {
            curve: 'basis',
            htmlLabels: true,
            useMaxWidth: true
          },
          sequence: {
            mirrorActors: false,
            useMaxWidth: true,
            showSequenceNumbers: false
          },
          er: {
            useMaxWidth: true
          },
          themeVariables: {
            primaryColor: '#e8f4ff',
            primaryBorderColor: '#25689f',
            primaryTextColor: '#0f2747',
            lineColor: '#2f5d7c',
            secondaryColor: '#eef9f7',
            tertiaryColor: '#fff7ed',
            actorBorder: '#25689f',
            actorBkg: '#f8fbff',
            actorTextColor: '#0f2747',
            activationBorderColor: '#1fb6a6',
            activationBkgColor: '#e9fbf7',
            noteBkgColor: '#fff7ed',
            noteBorderColor: '#f59e0b',
            fontFamily: 'Segoe UI, Arial, sans-serif'
          }
        });
      }
    });
  </script>
</head>
<body>
  <main class="page">
    <section class="content">
      ${html}
      <div class="footer-note">LumiLearn LMS - Bản nháp báo cáo dự án</div>
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(outputPath, doc, 'utf8');
console.log(outputPath);
