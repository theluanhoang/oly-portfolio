'use client';

import { useState, useCallback } from 'react';
import { VisualEditorV3 } from '@/components/admin/VisualEditorV3';
import { isVisualEditorContent } from '@/components/admin/VisualEditorV3';
import { VisualContentRenderer } from '@/components/projects/VisualContentRenderer';

// -------------------------------------------------------
// Một số preset canvas mẫu để test nhanh
// -------------------------------------------------------
const SAMPLE_PRESETS = {
  empty: '',
  basic: '__VISUAL_v1__' + JSON.stringify({
    version: '1',
    canvasWidth: 1200,
    canvasHeight: 800,
    background: '#ffffff',
    elements: [
      {
        id: 'el-sample-1',
        type: 'heading',
        x: 80,
        y: 60,
        width: 700,
        height: 80,
        zIndex: 1,
        content: 'Tiêu đề dự án',
        headingLevel: 1,
        style: { fontSize: 48, fontWeight: 'bold', color: '#1e293b', lineHeight: 1.2 },
      },
      {
        id: 'el-sample-2',
        type: 'text',
        x: 80,
        y: 160,
        width: 600,
        height: 120,
        zIndex: 2,
        content: '<p>Đây là đoạn mô tả dự án. Bạn có thể kéo thả element này tới bất kỳ vị trí nào trên canvas. Double-click để chỉnh sửa nội dung.</p>',
        style: { fontSize: 16, color: '#475569', lineHeight: 1.7 },
      },
      {
        id: 'el-sample-3',
        type: 'divider',
        x: 80,
        y: 300,
        width: 800,
        height: 40,
        zIndex: 3,
        content: '',
        style: { dividerColor: '#e2e8f0', dividerThickness: 1, dividerStyle: 'solid' },
      },
      {
        id: 'el-sample-4',
        type: 'heading',
        x: 80,
        y: 360,
        width: 400,
        height: 60,
        zIndex: 4,
        content: 'Thông tin dự án',
        headingLevel: 2,
        style: { fontSize: 28, fontWeight: 'bold', color: '#334155' },
      },
      {
        id: 'el-sample-5',
        type: 'text',
        x: 80,
        y: 440,
        width: 300,
        height: 160,
        zIndex: 5,
        content: '<p><strong>Địa điểm:</strong> Hà Nội</p><p><strong>Diện tích:</strong> 120 m²</p><p><strong>Năm:</strong> 2024</p><p><strong>Phong cách:</strong> Hiện đại</p>',
        style: { fontSize: 15, color: '#475569', lineHeight: 1.8, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8 },
      },
      {
        id: 'el-sample-6',
        type: 'image',
        x: 500,
        y: 360,
        width: 500,
        height: 320,
        zIndex: 6,
        content: '',
        style: { objectFit: 'cover', borderRadius: 8 },
      },
    ],
  }),
  layout2col: '__VISUAL_v1__' + JSON.stringify({
    version: '1',
    canvasWidth: 1200,
    canvasHeight: 900,
    background: '#fafafa',
    elements: [
      {
        id: 'el-2c-1',
        type: 'heading',
        x: 60,
        y: 50,
        width: 1080,
        height: 70,
        zIndex: 1,
        content: 'Layout 2 Cột',
        headingLevel: 1,
        style: { fontSize: 42, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
      },
      {
        id: 'el-2c-2',
        type: 'image',
        x: 60,
        y: 150,
        width: 520,
        height: 400,
        zIndex: 2,
        content: '',
        style: { objectFit: 'cover', borderRadius: 4 },
      },
      {
        id: 'el-2c-3',
        type: 'text',
        x: 620,
        y: 150,
        width: 520,
        height: 200,
        zIndex: 3,
        content: '<p>Đây là nội dung cột bên phải. Layout 2 cột cho phép đặt ảnh và text song song nhau.</p>',
        style: { fontSize: 16, color: '#334155', lineHeight: 1.8 },
      },
      {
        id: 'el-2c-4',
        type: 'text',
        x: 620,
        y: 370,
        width: 520,
        height: 180,
        zIndex: 4,
        content: '<p>Thêm một đoạn văn bản nữa ở cột phải. Bạn có thể resize bằng cách kéo các handle ở góc.</p>',
        style: { fontSize: 14, color: '#64748b', lineHeight: 1.6 },
      },
    ],
  }),
};

// -------------------------------------------------------
// Page Component
// -------------------------------------------------------
export default function VisualTestPage() {
  const [content, setContent] = useState(SAMPLE_PRESETS.basic);
  const [jsonVisible, setJsonVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<keyof typeof SAMPLE_PRESETS>('basic');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'editor' | 'preview'>('editor');

  const handleChange = useCallback((val: string) => {
    setContent(val);
  }, []);

  const loadPreset = (key: keyof typeof SAMPLE_PRESETS) => {
    setActivePreset(key);
    setContent(SAMPLE_PRESETS[key]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleClear = () => {
    setContent('');
    setActivePreset('empty');
  };

  // Parse JSON để hiển thị đẹp hơn
  let parsedJson = '';
  try {
    if (isVisualEditorContent(content)) {
      const prefix = '__VISUAL_v1__';
      const json = JSON.parse(content.slice(prefix.length));
      parsedJson = JSON.stringify(json, null, 2);
    }
  } catch {
    parsedJson = content;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: '#e2e8f0',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        background: '#0f172a',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 'none' }}>
          <span style={{ fontSize: '20px' }}>🎨</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.03em' }}>
              Visual Editor V3
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Sandbox · Không cần form</div>
          </div>
        </div>

        <div style={{ width: 1, height: 32, background: '#1e293b', flexShrink: 0 }} />

        {/* Preset buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>
            Preset:
          </span>
          {(Object.keys(SAMPLE_PRESETS) as (keyof typeof SAMPLE_PRESETS)[]).map((key) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activePreset === key
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'rgba(255,255,255,0.07)',
                color: activePreset === key ? '#fff' : '#94a3b8',
                boxShadow: activePreset === key ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              {key === 'empty' ? '⬜ Trống' : key === 'basic' ? '📄 Cơ bản' : '⬛ 2 Cột'}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 32, background: '#1e293b', flexShrink: 0 }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setJsonVisible((v) => !v)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: jsonVisible ? '#1e293b' : 'transparent',
              color: jsonVisible ? '#a5b4fc' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {jsonVisible ? '🔼 Ẩn JSON' : '🔽 Xem JSON'}
          </button>

          <button
            onClick={handleCopy}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: copied ? 'rgba(34,197,94,0.15)' : 'transparent',
              color: copied ? '#4ade80' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {copied ? '✅ Đã copy' : '📋 Copy JSON'}
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(239,68,68,0.3)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'transparent',
              color: '#f87171',
              transition: 'all 0.15s',
            }}
          >
            🗑 Xoá canvas
          </button>
        </div>

        <div style={{ width: 1, height: 32, background: '#1e293b', flexShrink: 0 }} />

        {/* Editor / Preview toggle */}
        <div style={{
          display: 'flex',
          background: '#1e293b',
          borderRadius: '8px',
          padding: '3px',
          gap: '2px',
          flexShrink: 0,
        }}>
          {(['editor', 'preview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === m
                  ? m === 'preview' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'transparent',
                color: mode === m ? '#fff' : '#64748b',
                boxShadow: mode === m ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {m === 'editor' ? '✏️ Editor' : '👁 Preview'}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Status badge */}
        <div style={{
          padding: '4px 10px',
          borderRadius: '20px',
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.25)',
          color: '#4ade80',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          {isVisualEditorContent(content) ? 'Visual mode' : 'Empty'}
        </div>

        {/* Link về admin */}
        <a
          href="/vi/admin/projects"
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
        >
          ← Admin
        </a>
      </div>

      {/* JSON Inspector panel */}
      {jsonVisible && (
        <div style={{
          background: '#0a0f1a',
          borderBottom: '1px solid #1e293b',
          padding: '16px 24px',
          maxHeight: '240px',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Canvas JSON ({content.length} chars · {isVisualEditorContent(content) ? (JSON.parse(parsedJson || '{}')?.elements?.length ?? 0) + ' elements' : 'not visual'})
          </div>
          <pre style={{
            fontSize: '11px',
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontFamily: "'Fira Code', 'Consolas', monospace",
          }}>
            {parsedJson || '(trống)'}
          </pre>
        </div>
      )}

      {/* Chú thích phím tắt */}
      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '8px 24px',
        background: '#0a0f1a',
        borderBottom: '1px solid #1e293b',
        fontSize: '11px',
        color: '#475569',
        flexWrap: 'wrap',
      }}>
        {[
          ['Double-click', 'Chỉnh sửa text'],
          ['Shift+Click', 'Multi-select'],
          ['Delete', 'Xóa element'],
          ['Ctrl+Z', 'Undo'],
          ['Ctrl+Y', 'Redo'],
          ['Ctrl+D', 'Nhân đôi'],
          ['Escape', 'Bỏ chọn'],
          ['Ctrl+A', 'Chọn tất cả'],
        ].map(([key, desc]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <kbd style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '10px',
              color: '#a5b4fc',
              fontFamily: 'monospace',
              fontWeight: 700,
            }}>{key}</kbd>
            <span>{desc}</span>
          </span>
        ))}
      </div>

      {/* Editor / Preview */}
      {mode === 'editor' ? (
        <div style={{ height: 'calc(100vh - 165px)', minHeight: '600px' }}>
          <VisualEditorV3
            value={content}
            onChange={handleChange}
            locale="vi"
          />
        </div>
      ) : (
        /* ---- Preview Panel ---- */
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#f8fafc',
          minHeight: 'calc(100vh - 165px)',
        }}>
          {/* Preview header */}
          <div style={{
            padding: '12px 24px',
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
              Preview — Render giống trang public
            </span>
            <span style={{
              fontSize: '11px',
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              padding: '2px 8px',
              fontWeight: 600,
            }}>
              {isVisualEditorContent(content) ? '✓ Visual format' : '⚠ Not visual'}
            </span>
          </div>

          {/* Rendered content */}
          <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 24px' }}>
            {isVisualEditorContent(content) ? (
              <div style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}>
                <VisualContentRenderer content={content} fluid={true} />
              </div>
            ) : (
              <div style={{
                padding: '40px',
                background: '#fff',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '14px',
              }}>
                Canvas trống hoặc không phải Visual format.
                <br />
                Hãy thêm elements vào editor rồi xem lại.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
