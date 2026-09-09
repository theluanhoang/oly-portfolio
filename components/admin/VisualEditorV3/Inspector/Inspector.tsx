'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { CanvasElement, ElementStyle, HeadingLevel } from '../types';

interface InspectorProps {
  selectedElements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<Omit<CanvasElement, 'id'>>) => void;
  onUpdateStyle: (id: string, style: Partial<ElementStyle>) => void;
  onReorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onLockElement: (id: string, locked: boolean) => void;
  onDeleteElement: (id: string) => void;
}

const C = {
  bg: '#ffffff', surface: '#f9fafb', border: '#e5e7eb',
  text: '#111827', muted: '#6b7280', faint: '#9ca3af',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: '10px', fontWeight: 700, color: C.faint,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${C.border}`,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: C.muted, minWidth: '40px', flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: '5px', padding: '5px 8px', fontSize: '12px',
  color: '#111827', outline: 'none', width: '100%', fontFamily: 'inherit',
};

const layerBtnStyle: React.CSSProperties = {
  padding: '6px', background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: '5px', color: '#374151', fontSize: '11px',
  cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit',
};

function ColorPicker({ value, fallback, onChange, onReset }: {
  value: string | undefined; fallback: string;
  onChange: (v: string) => void; onReset: () => void;
}) {
  const hasValue = value != null;
  // Local state for instant visual feedback while dragging
  const [localColor, setLocalColor] = useState(value ?? fallback);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state if value changes externally (e.g. element selection change)
  useEffect(() => {
    setLocalColor(value ?? fallback);
  }, [value, fallback]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    // Update local immediately for smooth visual
    setLocalColor(color);
    // Debounce the expensive state dispatch
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(color);
    }, 80);
  }, [onChange]);

  // Flush immediately when picker closes (mouseup / blur)
  const handleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    onChange(localColor);
  }, [onChange, localColor]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <div style={{
          width: '100%', height: 28, borderRadius: '5px', border: '1px solid #e5e7eb',
          background: localColor, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        }}>
          <input
            type="color" value={localColor}
            onChange={handleChange}
            onBlur={handleBlur}
            style={{ ...inputStyle, padding: '2px', height: 28, cursor: 'pointer', opacity: hasValue ? 1 : 0.45 }}
          />
        </div>
      </div>
      {hasValue && (
        <button type="button" onClick={onReset} title="Reset" style={{
          flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#f3f4f6', border: '1px solid #e5e7eb',
          borderRadius: '4px', color: '#6b7280', fontSize: '12px', lineHeight: 1,
          cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}>x</button>
      )}
    </div>
  );
}

export function Inspector({
  selectedElements, onUpdateElement, onUpdateStyle, onReorderElement, onLockElement, onDeleteElement,
}: InspectorProps) {
  const t = useTranslations('Admin.VisualEditor.inspector');
  const PANEL_W = 248;
  const panelRef = useRef<HTMLDivElement>(null);
  // Default position: top-right of viewport (SSR-safe)
  const [pos, setPos] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - PANEL_W - 16 : 900,
    y: 120,
  }));
  const [collapsed, setCollapsed] = useState(false);
  const dragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...pos };
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startMouse.current.x;
      const dy = e.clientY - startMouse.current.y;
      const newX = Math.max(0, Math.min(window.innerWidth - PANEL_W, startPos.current.x + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 40, startPos.current.y + dy));
      setPos({ x: newX, y: newY });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const hasSelection = selectedElements.length > 0;
  const el = selectedElements[0];
  const multi = selectedElements.length > 1;
  const applyStyle = (s: Partial<ElementStyle>) => selectedElements.forEach((e) => onUpdateStyle(e.id, s));
  const applyUpdate = (u: Partial<Omit<CanvasElement, 'id'>>) => { if (el) onUpdateElement(el.id, u); };

  return (
    <div
      ref={panelRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: PANEL_W,
        zIndex: 9999,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Header / drag handle */}
      <div onMouseDown={onHeaderMouseDown} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10px', height: 38, cursor: 'grab',
        background: C.surface,
        borderBottom: collapsed ? 'none' : `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <svg width="10" height="12" viewBox="0 0 10 12" style={{ opacity: 0.3, flexShrink: 0 }}>
            {[0,4,8].map(y => [0,4].map(x => (
              <circle key={`${x}-${y}`} cx={x+1} cy={y+2} r="1.2" fill="#374151"/>
            )))}
          </svg>
          <span style={{
            fontSize: '11px', fontWeight: 700, color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {hasSelection ? (multi ? t('blocks', { count: selectedElements.length }) : el.type) : t('title')}
          </span>
          {hasSelection && !multi && (
            <span style={{ fontSize: '10px', color: C.faint }}>#{el.id.slice(-5)}</span>
          )}
        </div>
        <button type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px 4px', color: C.faint, display: 'flex', alignItems: 'center',
            borderRadius: '4px',
          }}
          title={collapsed ? t('expand') : t('collapse')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ overflowY: 'auto', maxHeight: 560, padding: '12px' }}>
          {!hasSelection ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '24px 0', gap: '8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', opacity: 0.35 }}>↖</div>
              <div style={{ color: C.muted, fontSize: '12px', lineHeight: 1.5 }}>
                {t('selectPrompt')}
              </div>
            </div>
          ) : (<>
            {!multi && (
              <Section title={t('sections.position')}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[['X','x',Math.round(el.x)],['Y','y',Math.round(el.y)],
                    ['W','width',Math.round(el.width)],['H','height',Math.round(el.height)]].map(([label,key,value]) => (
                    <div key={key as string} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '10px', color: C.faint }}>{label}</span>
                      <input type="number" value={value as number}
                        onChange={(e) => applyUpdate({ [key as string]: Number(e.target.value) })}
                        style={{ ...inputStyle, padding: '4px 6px' }} />
                    </div>
                  ))}
                </div>
                <Row label="Z">
                  <input type="number" value={el.zIndex}
                    onChange={(e) => applyUpdate({ zIndex: Number(e.target.value) })}
                    style={inputStyle} />
                </Row>
              </Section>
            )}
            {!multi && el.type === 'heading' && (
              <Section title={t('sections.heading')}>
                <Row label={t('fields.level')}>
                  <select value={el.headingLevel || 1}
                    onChange={(e) => applyUpdate({ headingLevel: Number(e.target.value) as HeadingLevel })}
                    style={inputStyle}>
                    {[1,2,3,4].map(l => <option key={l} value={l}>H{l}</option>)}
                  </select>
                </Row>
              </Section>
            )}
            {(el.type === 'text' || el.type === 'heading') && (
              <Section title={t('sections.text')}>
                <Row label={t('fields.size')}>
                  <input type="number" value={el.style.fontSize || 16}
                    onChange={(e) => applyStyle({ fontSize: Number(e.target.value) })}
                    style={inputStyle} />
                  <span style={{ color: C.faint, fontSize: '11px', flexShrink: 0 }}>px</span>
                </Row>
                <Row label={t('fields.lineHeight')}>
                  <input type="number" min={0.5} max={4} step={0.1}
                    value={el.style.lineHeight || 1.6}
                    onChange={(e) => applyStyle({ lineHeight: Number(e.target.value) })}
                    style={inputStyle} />
                </Row>
                <Row label={t('fields.letterSpacing')}>
                  <input type="number" min={-0.2} max={1} step={0.01}
                    value={el.style.letterSpacing || 0}
                    onChange={(e) => applyStyle({ letterSpacing: Number(e.target.value) })}
                    style={inputStyle} />
                  <span style={{ color: C.faint, fontSize: '11px', flexShrink: 0 }}>em</span>
                </Row>
                <Row label={t('fields.color')}>
                  <ColorPicker value={el.style.color} fallback="#000000"
                    onChange={(v) => applyStyle({ color: v })}
                    onReset={() => applyStyle({ color: undefined })} />
                </Row>
              </Section>
            )}
            <Section title={t('sections.background')}>
              <Row label={t('fields.background')}>
                <ColorPicker value={el.style.backgroundColor} fallback="#ffffff"
                  onChange={(v) => applyStyle({ backgroundColor: v })}
                  onReset={() => applyStyle({ backgroundColor: undefined })} />
              </Row>
              <Row label={t('fields.opacity')}>
                <input type="range" min={0} max={1} step={0.05}
                  value={el.style.opacity ?? 1}
                  onChange={(e) => applyStyle({ opacity: Number(e.target.value) })}
                  style={{ flex: 1, cursor: 'pointer', accentColor: '#111827' }} />
                <span style={{ color: C.muted, fontSize: '11px', minWidth: 28, textAlign: 'right' }}>
                  {Math.round((el.style.opacity ?? 1) * 100)}%
                </span>
              </Row>
              <Row label={t('fields.radius')}>
                <input type="number" min={0}
                  value={el.style.borderRadius || 0}
                  onChange={(e) => applyStyle({ borderRadius: Number(e.target.value) })}
                  style={inputStyle} />
                <span style={{ color: C.faint, fontSize: '11px', flexShrink: 0 }}>px</span>
              </Row>
            </Section>
            {el.type === 'image' && (
              <Section title={t('sections.image')}>
                <Row label={t('fields.fit')}>
                  <select value={el.style.objectFit || 'cover'}
                    onChange={(e) => applyStyle({ objectFit: e.target.value as ElementStyle['objectFit'] })}
                    style={inputStyle}>
                    {['cover','contain','fill','none'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Row>
              </Section>
            )}
            {el.type === 'divider' && (
              <Section title={t('sections.divider')}>
                <Row label={t('fields.color')}>
                  <ColorPicker value={el.style.dividerColor} fallback="#d1d5db"
                    onChange={(v) => applyStyle({ dividerColor: v })}
                    onReset={() => applyStyle({ dividerColor: undefined })} />
                </Row>
                <Row label={t('fields.thickness')}>
                  <input type="number" min={1} max={20}
                    value={el.style.dividerThickness || 1}
                    onChange={(e) => applyStyle({ dividerThickness: Number(e.target.value) })}
                    style={inputStyle} />
                  <span style={{ color: C.faint, fontSize: '11px', flexShrink: 0 }}>px</span>
                </Row>
                <Row label={t('fields.style')}>
                  <select value={el.style.dividerStyle || 'solid'}
                    onChange={(e) => applyStyle({ dividerStyle: e.target.value as ElementStyle['dividerStyle'] })}
                    style={inputStyle}>
                    {['solid','dashed','dotted'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Row>
              </Section>
            )}
            {!multi && (
              <Section title={t('sections.layer')}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {(['top','up','down','bottom'] as const).map((dir) => (
                    <button type="button" key={dir}
                      onClick={() => onReorderElement(el.id, dir)}
                      style={layerBtnStyle}>
                      {t(`layer.${dir}`)}
                    </button>
                  ))}
                </div>
              </Section>
            )}
            {!multi && (
              <Section title={t('sections.manage')}>
                <button type="button" onClick={() => onLockElement(el.id, !el.locked)} style={{
                  padding: '7px 12px', background: el.locked ? '#111827' : '#f9fafb',
                  border: `1px solid ${el.locked?'#111827':'#e5e7eb'}`, borderRadius: '5px',
                  color: el.locked?'#fff':'#374151', fontSize: '12px', cursor: 'pointer',
                  width: '100%', fontFamily: 'inherit',
                }}>
                  {el.locked ? t('locked') : t('lock')}
                </button>
                <button type="button" onClick={() => onDeleteElement(el.id)} style={{
                  padding: '7px 12px', background: '#fff5f5', border: '1px solid #fecaca',
                  borderRadius: '5px', color: '#ef4444', fontSize: '12px', cursor: 'pointer',
                  width: '100%', fontFamily: 'inherit',
                }}>
                  {t('deleteElement')}
                </button>
              </Section>
            )}
          </>)}
        </div>
      )}
    </div>
  );
}
