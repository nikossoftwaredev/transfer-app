import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

const mdPath = path.resolve('docs/TransferGR-Client-Proposal.md');
const outputPath = path.resolve('docs/TransferGR-Client-Proposal.pdf');

const markdown = fs.readFileSync(mdPath, 'utf-8');
const htmlContent = marked.parse(markdown);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a1a2e;
    line-height: 1.7;
    font-size: 11pt;
  }

  /* Cover page */
  .cover {
    page-break-after: always;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #16213e 100%);
    color: white;
    padding: 60px;
  }

  .cover-logo {
    font-size: 14pt;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #64ffda;
    margin-bottom: 40px;
    font-weight: 300;
  }

  .cover h1 {
    font-size: 42pt;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: -1px;
  }

  .cover .subtitle {
    font-size: 16pt;
    color: #a0aec0;
    font-weight: 300;
    margin-bottom: 60px;
  }

  .cover-meta {
    font-size: 10pt;
    color: #718096;
    line-height: 2;
  }

  .cover-meta strong {
    color: #a0aec0;
  }

  .cover-divider {
    width: 80px;
    height: 2px;
    background: #64ffda;
    margin: 40px auto;
  }

  .cover-note {
    margin-top: 40px;
    font-size: 9pt;
    color: #718096;
    font-style: italic;
    max-width: 400px;
  }

  /* Content */
  .content {
    padding: 0 50px;
  }

  h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #0f0f23;
    margin: 40px 0 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #64ffda;
  }

  h2 {
    font-size: 16pt;
    font-weight: 600;
    color: #1a1a3e;
    margin: 32px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }

  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #2d3748;
    margin: 24px 0 8px;
  }

  p {
    margin: 8px 0;
    color: #2d3748;
  }

  strong {
    font-weight: 600;
    color: #1a1a2e;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10pt;
  }

  thead {
    background: #1a1a3e;
    color: white;
  }

  th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    color: #2d3748;
  }

  tr:nth-child(even) {
    background: #f7fafc;
  }

  /* Lists */
  ul, ol {
    margin: 8px 0 8px 24px;
    color: #2d3748;
  }

  li {
    margin: 4px 0;
  }

  li strong {
    color: #1a1a3e;
  }

  /* Blockquotes (notes) */
  blockquote {
    background: #f0fdf4;
    border-left: 4px solid #64ffda;
    padding: 12px 20px;
    margin: 16px 0;
    border-radius: 0 6px 6px 0;
    font-size: 10pt;
  }

  blockquote p {
    color: #2d3748;
  }

  /* Code blocks */
  code {
    background: #edf2f7;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9pt;
    font-family: 'Fira Code', monospace;
  }

  pre {
    background: #1a1a2e;
    color: #e2e8f0;
    padding: 16px 20px;
    border-radius: 6px;
    margin: 12px 0;
    overflow-x: auto;
    font-size: 9pt;
  }

  pre code {
    background: none;
    padding: 0;
    color: inherit;
  }

  /* Horizontal rules */
  hr {
    border: none;
    height: 1px;
    background: #e2e8f0;
    margin: 32px 0;
  }

  /* Price highlight */
  h3:has(strong) {
    font-size: 20pt;
    color: #0f0f23;
    text-align: center;
    margin: 24px 0;
    padding: 20px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-radius: 8px;
    border: 1px solid #a7f3d0;
  }

  /* Page breaks before major sections */
  .content h2:nth-of-type(4n+1) {
    page-break-before: always;
  }

  /* Footer */
  @page {
    margin: 50px 40px 60px 40px;
    @bottom-center {
      content: "TransferGR — Confidential";
      font-size: 8pt;
      color: #a0aec0;
    }
    @bottom-right {
      content: counter(page);
      font-size: 8pt;
      color: #a0aec0;
    }
  }

  @page:first {
    margin: 0;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-logo">Hexaigon</div>
  <h1 style="border: none; padding: 0; margin-bottom: 16px;">TransferGR</h1>
  <div class="subtitle">Platform Overview & Proposal</div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <strong>Prepared for:</strong> [Client Name]<br>
    <strong>Prepared by:</strong> Hexaigon<br>
    <strong>Date:</strong> March 2026<br>
    <strong>Version:</strong> 1.0
  </div>
  <div class="cover-note">
    "TransferGR" is a working title. The final platform name, branding, and domain will be decided before launch.
  </div>
</div>

<div class="content">
${htmlContent}
</div>

</body>
</html>`;

// Remove the first h1 + metadata + note from content since cover page handles it
const cleanHtml = html
  .replace(/<h1[^>]*>TransferGR — Platform Overview<\/h1>/, '')
  .replace(/<p><strong>Prepared for:<\/strong>.*?<\/p>/s, '')
  .replace(/<p><strong>Prepared by:<\/strong>.*?<\/p>/s, '')
  .replace(/<p><strong>Date:<\/strong>.*?<\/p>/s, '')
  .replace(/<p><strong>Version:<\/strong>.*?<\/p>/s, '')
  .replace(/<blockquote>\s*<p><strong>Note:<\/strong>.*?<\/blockquote>/s, '');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(cleanHtml, { waitUntil: 'networkidle0' });

await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="width: 100%; font-size: 8px; font-family: Inter, sans-serif; color: #a0aec0; display: flex; justify-content: space-between; padding: 0 40px;">
      <span>TransferGR — Confidential</span>
      <span>Hexaigon</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `,
  margin: {
    top: '50px',
    bottom: '60px',
    left: '40px',
    right: '40px',
  },
});

await browser.close();
console.log(`PDF generated: ${outputPath}`);
