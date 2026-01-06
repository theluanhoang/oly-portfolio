# Phân Tích Logic Drag & Drop Reorder Images - TiptapEditor

## 📋 Tóm Tắt

File `TiptapEditor.tsx` có logic drag & drop để reorder images, nhưng có nhiều vấn đề khiến logic không bao quát tất cả trường hợp và có thể gây lỗi.

---

## 🔴 Các Vấn Đề Nghiêm Trọng

### 1. **Stale State - State Không Đồng Bộ**

**Vấn đề:**
- Trong `handleDocumentMouseMove` (line 1074-1468), code lấy `node`, `nodeSize` từ `view.state` mỗi lần mouse move
- Nhưng document có thể đã thay đổi giữa các lần gọi (do operations khác, undo/redo, etc.)
- `dragStartPos` có thể không còn valid nữa

**Code có vấn đề:**
```typescript
// Line 1112-1121
const { doc } = view.state;
const node = doc.nodeAt(dragStartPos); // ⚠️ Node có thể đã thay đổi!
const nodeSize = node.nodeSize; // ⚠️ Size có thể đã thay đổi!
```

**Hậu quả:**
- Drag có thể fail nếu document thay đổi trong lúc drag
- Position calculation sai nếu node size thay đổi
- Có thể gây crash hoặc mất data

---

### 2. **Race Conditions - Xung Đột Đồng Thời**

**Vấn đề:**
- Không có lock mechanism để prevent multiple simultaneous drags
- `pendingInsertPos` có thể bị update bởi nhiều mouse move events đồng thời
- Không có validation để đảm bảo drag state vẫn còn valid

**Hậu quả:**
- Multiple drags có thể conflict với nhau
- Position calculation có thể bị overwrite bởi event sau
- Insert có thể vào vị trí sai

---

### 3. **Logic Tính Toán Position Quá Phức Tạp và Dễ Sai**

**Vấn đề:**
- Hàm `findValidInsertPosition` (lines 1151-1349) có hơn 200 dòng code với nhiều nested conditions
- Logic tính `finalInsertPos` sau khi delete (lines 1372-1400) có nhiều edge cases
- Đặc biệt sai khi:
  - Drag trong cùng một parent node
  - Drag backward/forward không đúng
  - Drag vào đầu/cuối document

**Code có vấn đề:**
```typescript
// Line 1221-1224: Logic direction có thể sai
const direction = pos < nodeStart ? 'forward' : 'backward';
const result = pos < nodeStart ? clampedPos : clampedPos + nodeAtPos.nodeSize;
// ⚠️ Logic này không đúng trong mọi trường hợp!
// Ví dụ: Khi drag vào giữa 2 nodes, logic này có thể insert sai vị trí
```

**Hậu quả:**
- Image có thể được insert vào vị trí sai
- Drag backward/forward không hoạt động đúng
- Edge cases như drag vào đầu/cuối document có thể fail

---

### 4. **Validation Position Không Đầy Đủ**

**Vấn đề:**
- Validation trong `handleDocumentMouseMove` (lines 1422-1466) sử dụng test transaction
- Nhưng document có thể đã thay đổi khi `handleDocumentMouseUp` được gọi
- Position có thể invalid tại thời điểm thực thi nhưng đã pass validation

**Code có vấn đề:**
```typescript
// Line 1424-1441: Test transaction validation
const testTr = view.state.tr;
testTr.delete(nodeStart, nodeEnd);
const testDoc = testTr.doc;
// ⚠️ Document có thể đã thay đổi khi mouseUp được gọi!
// Validation này chỉ đúng tại thời điểm mouseMove, không đảm bảo khi mouseUp
```

**Hậu quả:**
- Insert có thể fail mặc dù đã pass validation
- Error có thể xảy ra khi dispatch transaction
- User experience bị ảnh hưởng (drag nhưng không move được)

---

### 5. **Node State Không Được Đồng Bộ**

**Vấn đề:**
- `dragPreviewNode` được capture ở mousedown (line 960) nhưng không được update
- Nếu node được modify trong lúc drag (ví dụ: resize, change alignment), `dragPreviewNode` sẽ stale
- `nodeSize` được lấy một lần nhưng có thể thay đổi

**Code có vấn đề:**
```typescript
// Line 959-960: Node được capture một lần
dragPreviewNode = nodeAtPos; // ⚠️ Node này có thể đã thay đổi!
// Nếu user resize image trong lúc drag, dragPreviewNode vẫn giữ size cũ
```

**Hậu quả:**
- Attributes mới của node có thể bị mất khi drag
- Node size mismatch có thể gây ra position calculation sai
- Alignment và các attributes khác có thể không được preserve đúng

---

### 6. **Edge Cases Không Được Handle**

**Các trường hợp không được handle:**
1. **Drag vào empty document**: Code không check nếu document rỗng
2. **Drag vào position giữa 2 nodes không thể chứa image**: Validation không đủ
3. **Drag khi document đang được modify bởi operation khác**: Không có lock
4. **Drag vào nested structures** (tables, lists, etc.): Logic không handle nested cases
5. **Drag khi có undo/redo operation**: State có thể bị conflict
6. **Drag khi có multiple images cùng lúc**: Không support

**Hậu quả:**
- Insert có thể fail silently
- Image có thể bị mất hoặc insert vào vị trí sai
- UI có thể bị inconsistent state

---

## ✅ Giải Pháp Tối Ưu

### Giải pháp 1: Sử dụng ProseMirror's Built-in Drag & Drop (Khuyến nghị)

**Ưu điểm:**
- ProseMirror có built-in support cho drag & drop
- Đã được test kỹ và handle tất cả edge cases
- Tự động sync với document state
- Ít bugs hơn và dễ maintain hơn

**Implementation:**
```typescript
// Trong ResizableImage extension, thêm:
addProseMirrorPlugins() {
  return [
    new Plugin({
      props: {
        handleDrop: (view, event, slice, moved) => {
          if (moved) {
            // ProseMirror đã handle move, chỉ cần update selection
            const { selection } = view.state;
            const { $from } = selection;
            const node = $from.nodeAfter || $from.nodeBefore;
            
            if (node && node.type.name === 'image') {
              const pos = $from.pos;
              const event = new CustomEvent('selectImage', { 
                detail: { pos } 
              });
              document.dispatchEvent(event);
            }
            
            return true;
          }
          return false;
        },
        handleDragStart: (view, event) => {
          // Custom drag start logic nếu cần
          return false; // Let ProseMirror handle
        },
      },
    }),
  ];
}
```

---

### Giải pháp 2: Cải Thiện Logic Hiện Tại

Nếu muốn giữ custom logic, cần implement các cải thiện sau:

#### 2.1. Lock State và Prevent Race Conditions

```typescript
// Thêm drag state lock
interface DragState {
  isActive: boolean;
  startPos: number;
  node: PMNode;
  nodeSize: number;
  nodeId: string;
  startTime: number;
}

let dragState: DragState | null = null;

const startDrag = (pos: number, view: EditorView): boolean => {
  // Prevent multiple drags
  if (dragState?.isActive) {
    console.warn('Drag already in progress');
    return false;
  }
  
  const { doc } = view.state;
  const node = doc.nodeAt(pos);
  if (!node || node.type.name !== 'image') {
    return false;
  }
  
  // Lock drag state
  dragState = {
    isActive: true,
    startPos: pos,
    node: node,
    nodeSize: node.nodeSize,
    nodeId: node.attrs.id,
    startTime: Date.now(),
  };
  
  return true;
};

const cleanupDrag = () => {
  dragState = null;
  // ... other cleanup
};
```

#### 2.2. Simplify Position Calculation

```typescript
const findInsertPosition = (
  targetPos: number,
  dragState: DragState,
  doc: Node
): number | null => {
  // 1. Clamp position
  const clampedPos = Math.max(0, Math.min(targetPos, doc.content.size));
  
  // 2. Skip if inside dragged node
  const { startPos, nodeSize } = dragState;
  if (clampedPos > startPos && clampedPos < startPos + nodeSize) {
    return null;
  }
  
  // 3. Find nearest valid position
  // Strategy: Try exact position first, then search nearby (±10 positions)
  const searchRange = 10;
  const positionsToTry = [
    clampedPos,
    ...Array.from({ length: searchRange }, (_, i) => clampedPos - i - 1),
    ...Array.from({ length: searchRange }, (_, i) => clampedPos + i + 1),
  ];
  
  for (const pos of positionsToTry) {
    if (pos < 0 || pos > doc.content.size) continue;
    
    try {
      const $pos = doc.resolve(pos);
      const parent = $pos.parent;
      const index = $pos.index();
      
      // Check if we can insert image here
      if (parent.canReplace(index, index, Fragment.from(dragState.node))) {
        return pos;
      }
    } catch {
      continue;
    }
  }
  
  return null;
};
```

#### 2.3. Atomic Transaction với Validation

```typescript
const performDragDrop = (
  dragState: DragState,
  insertPos: number,
  view: EditorView
): boolean => {
  const { tr, doc } = view.state;
  
  // 1. Verify drag state is still valid
  const currentNode = doc.nodeAt(dragState.startPos);
  if (!currentNode || 
      currentNode.type.name !== 'image' ||
      currentNode.attrs.id !== dragState.nodeId) {
    console.warn('Drag state invalid - node may have changed');
    return false;
  }
  
  // 2. Calculate positions
  const nodeStart = dragState.startPos;
  const nodeEnd = nodeStart + currentNode.nodeSize;
  
  // 3. Adjust insert position for deletion
  let finalInsertPos = insertPos;
  if (insertPos > nodeEnd) {
    finalInsertPos = insertPos - currentNode.nodeSize;
  } else if (insertPos > nodeStart) {
    // Inserting after dragged node, but before nodeEnd
    finalInsertPos = nodeStart;
  }
  
  // 4. Validate final position với atomic transaction
  try {
    const testTr = tr;
    testTr.delete(nodeStart, nodeEnd);
    const testDoc = testTr.doc;
    
    if (finalInsertPos > testDoc.content.size) {
      finalInsertPos = testDoc.content.size;
    }
    
    const $insertPos = testDoc.resolve(finalInsertPos);
    if (!$insertPos.parent.canReplace(
      $insertPos.index(),
      $insertPos.index(),
      Fragment.from(currentNode)
    )) {
      console.warn('Cannot insert at final position');
      return false;
    }
  } catch (error) {
    console.error('Validation failed:', error);
    return false;
  }
  
  // 5. Perform atomic transaction
  try {
    const finalTr = view.state.tr;
    
    // Delete old position
    finalTr.delete(nodeStart, nodeEnd);
    
    // Insert at new position (after deletion, positions have shifted)
    const newNode = currentNode.type.create(
      currentNode.attrs,
      currentNode.content
    );
    finalTr.insert(finalInsertPos, newNode);
    
    // Dispatch
    view.dispatch(finalTr);
    
    // 6. Select moved node
    const newState = view.state;
    const newDoc = newState.doc;
    const movedNode = newDoc.nodeAt(finalInsertPos);
    
    if (movedNode && movedNode.attrs.id === dragState.nodeId) {
      const selectTr = newState.tr;
      selectTr.setSelection(
        TextSelection.create(newDoc, finalInsertPos, finalInsertPos + movedNode.nodeSize)
      );
      view.dispatch(selectTr);
    }
    
    return true;
  } catch (error) {
    console.error('Transaction failed:', error);
    return false;
  }
};
```

#### 2.4. Cleanup và Error Handling

```typescript
const handleDocumentMouseUp = () => {
  try {
    if (dragState?.isActive && pendingInsertPos !== null) {
      const success = performDragDrop(dragState, pendingInsertPos, view);
      if (!success) {
        console.warn('Drag drop failed, node not moved');
        // Optionally show user notification
      }
    }
  } catch (error) {
    console.error('Error in drag drop:', error);
    // Optionally show user notification
  } finally {
    cleanupDrag();
    removeDragPreview();
    // ... other cleanup
  }
};
```

---

## 📊 So Sánh Giải Pháp

| Tiêu chí | Custom Logic (Hiện tại) | ProseMirror Built-in | Improved Custom Logic |
|---------|---------------------------|---------------------|----------------------|
| Độ phức tạp | ⚠️ Rất cao (200+ lines) | ✅ Thấp (~20 lines) | ⚠️ Trung bình (~100 lines) |
| Độ tin cậy | ⚠️ Thấp (nhiều bugs) | ✅ Rất cao | ✅ Cao |
| Performance | ✅ Tốt | ✅ Tốt | ✅ Tốt |
| Maintainability | ⚠️ Khó maintain | ✅ Dễ maintain | ⚠️ Trung bình |
| Flexibility | ✅ Rất linh hoạt | ⚠️ Hạn chế | ✅ Linh hoạt |
| Edge Cases | ⚠️ Không handle đủ | ✅ Handle đầy đủ | ✅ Handle đầy đủ |

---

## 🎯 Khuyến Nghị

**Nên sử dụng ProseMirror's built-in drag & drop** vì:
1. ✅ Đã được test kỹ và handle tất cả edge cases
2. ✅ Tự động sync với document state
3. ✅ Dễ maintain hơn (ít code hơn)
4. ✅ Ít bugs hơn
5. ✅ Performance tốt

**Nếu cần custom logic**, thì:
1. ✅ Implement lock mechanism để prevent race conditions
2. ✅ Simplify position calculation logic
3. ✅ Add comprehensive validation
4. ✅ Ensure atomic transactions
5. ✅ Add proper error handling và cleanup
6. ✅ Test tất cả edge cases

---

## 🔧 Các Bước Triển Khai

### Bước 1: Quyết định approach
- Nếu không cần custom behavior đặc biệt → Dùng ProseMirror built-in
- Nếu cần custom behavior → Cải thiện logic hiện tại

### Bước 2: Implement
- Nếu dùng ProseMirror: Thêm plugin vào extension
- Nếu cải thiện: Refactor code theo giải pháp 2

### Bước 3: Test
- Test các edge cases:
  - Drag vào đầu/cuối document
  - Drag vào nested structures
  - Drag khi có undo/redo
  - Drag multiple images
  - Drag khi document đang modify

### Bước 4: Monitor
- Monitor errors trong production
- Collect user feedback
- Fix bugs nếu có

---

## 📝 Kết Luận

Logic drag & drop hiện tại có nhiều vấn đề về:
- State management
- Race conditions
- Position calculation
- Validation
- Edge cases

**Giải pháp tốt nhất:** Sử dụng ProseMirror's built-in drag & drop để đảm bảo reliability và maintainability.

**Nếu phải giữ custom logic:** Cần refactor theo giải pháp 2 với đầy đủ improvements.

