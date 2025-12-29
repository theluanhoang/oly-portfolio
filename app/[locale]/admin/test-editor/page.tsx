'use client';

import { useState } from 'react';
import TiptapEditor from '@/components/admin/TiptapEditor';

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>Start typing here...</p>');
  const [htmlOutput, setHtmlOutput] = useState('');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHtmlOutput(newContent);
  };

  const handleLoadSample = () => {
    const sampleContent = `
      <h1>Sample Content</h1>
      <p>This is a <strong>bold</strong> text and this is an <em>italic</em> text.</p>
      <p>This text has <u>underline</u> and this has <s>strikethrough</s>.</p>
      <h2>Lists</h2>
      <ul>
        <li>Bullet point 1</li>
        <li>Bullet point 2</li>
        <li>Bullet point 3</li>
      </ul>
      <ol>
        <li>Numbered item 1</li>
        <li>Numbered item 2</li>
        <li>Numbered item 3</li>
      </ol>
      <h2>Text Alignment</h2>
      <p style="text-align: left;">Left aligned text</p>
      <p style="text-align: center;">Center aligned text</p>
      <p style="text-align: right;">Right aligned text</p>
      <p style="text-align: justify;">Justified text that spreads across the full width of the container.</p>
      <h2>Subscript and Superscript</h2>
      <p>H<sub>2</sub>O and E=mc<sup>2</sup></p>
      <h2>Colors and Highlight</h2>
      <p><span style="color: #ff0000;">Red text</span> and <span style="color: #0000ff;">Blue text</span></p>
      <p><mark style="background-color: #ffff00;">Highlighted text</mark></p>
      <h2>Link</h2>
      <p><a href="https://example.com">Example Link</a></p>
      <h2>Image</h2>
      <p><img src="https://via.placeholder.com/400x200" alt="Placeholder" /></p>
      <h2>Table</h2>
      <table class="tiptap-table">
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
            <td>Cell 3</td>
          </tr>
          <tr>
            <td>Cell 4</td>
            <td>Cell 5</td>
            <td>Cell 6</td>
          </tr>
        </tbody>
      </table>
      <h2>Blockquote</h2>
      <blockquote>
        <p>This is a blockquote. It can contain multiple paragraphs and other content.</p>
      </blockquote>
      <h2>Code</h2>
      <p>Inline <code>code</code> example</p>
      <pre><code>Code block example
function test() {
  return 'Hello World';
}</code></pre>
      <hr />
      <p>Horizontal rule above</p>
    `;
    setContent(sampleContent);
    setHtmlOutput(sampleContent);
  };

  const handleClear = () => {
    setContent('');
    setHtmlOutput('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto py-12 px-8 md:px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tiptap Editor Test Page</h1>
          <p className="text-gray-600">Test all features of the Tiptap Editor component</p>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={handleLoadSample}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Load Sample Content
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Clear Editor
          </button>
        </div>

        <div className="mb-8">
          <TiptapEditor content={content} onChange={handleContentChange} />
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">HTML Output</h2>
            <div className="bg-gray-100 p-4 rounded border border-gray-300">
              <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap break-words">
                {htmlOutput || '(empty)'}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Rendered Preview</h2>
            <div className="bg-white p-6 rounded border border-gray-300 min-h-[200px]">
              <div
                className="project-content"
                dangerouslySetInnerHTML={{ __html: htmlOutput || '<p class="text-gray-400">(empty)</p>' }}
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Content Stats</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">HTML Length:</span>{' '}
                  <span className="text-gray-600">{htmlOutput.length} characters</span>
                </div>
                <div>
                  <span className="font-semibold">Word Count:</span>{' '}
                  <span className="text-gray-600">
                    {htmlOutput
                      ? htmlOutput.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
                      : 0}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Has Images:</span>{' '}
                  <span className="text-gray-600">{htmlOutput.includes('<img') ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="font-semibold">Has Links:</span>{' '}
                  <span className="text-gray-600">{htmlOutput.includes('<a ') ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="font-semibold">Has Tables:</span>{' '}
                  <span className="text-gray-600">{htmlOutput.includes('<table') ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="font-semibold">Has Iframes:</span>{' '}
                  <span className="text-gray-600">{htmlOutput.includes('<iframe') ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

