# Phân Tích Logic Drag & Drop Reorder Images trong TiptapEditor

## 🔴 Các Vấn Đề Nghiêm Trọng

### 1. **Stale State và Race Conditions**

**Vấn đề:**
- `dragStartPos`, `node`, `nodeSize` được lấy từ `view.state` trong `handleDocumentMouseMove` nhưng document có thể đã thay đổi giữa các lần gọi
- Không có cơ chế lock để prevent multiple simultaneous drags
- `pendingInsertPos` có thể bị update bởi nhiều mouse move events đồng thời

**Vị trí code:**
```typescript
// Line 1112-1121: State được lấy mỗi lần mouse move
const { doc } = view.state;
const node = doc.nodeAt(dragStartPos); // ⚠️ Node có thể đã thay đổi!
const nodeSize = node.nodeSize; // ⚠️ Size có thể đã thay đổi!
```

**Hậu quả:**
- Drag có thể fail nếu document thay đổi trong lúc drag
- Position calculation sai nếu node size thay đổi
- Multiple drags có thể conflict với nhau

---

### 2. **Logic Tính Toán Position Quá Phức Tạp và Dễ Sai**

**Vấn đề:**
- Hàm `findValidInsertPosition` (lines 1151-1349) quá phức tạp với nhiều nested conditions
- Logic tính `finalInsertPos` sau khi delete (lines 1372-1400) có nhiều edge cases không được handle đúng
- Đặc biệt sai khi drag trong cùng một parent node

**Vị trí code:**
```typescript
// Line 1221-1224: Logic direction có thể sai
const direction = pos < nodeStart ? 'forward' : 'backward';
const result = pos < nodeStart ? clampedPos : clampedPos + nodeAtPos.nodeSize;
// ⚠️ Logic này không đúng trong mọi trường hợp!
```

**Hậu quả:**
- Image có thể được insert vào vị trí sai
- Drag backward/forward không hoạt động đúng
- Edge cases như drag vào đầu/cuối document có thể fail

---

### 3. **Validation Position Không Đầy Đủ**

**Vấn đề:**
- Validation trong `handleDocumentMouseMove` (lines 1422-1466) sử dụng test transaction
- Nhưng document có thể đã thay đổi khi `handleDocumentMouseUp` được gọi
- Position có thể invalid tại thời điểm thực thi nhưng đã pass validation

**Vị trí code:**
```typescript
// Line 1424-1441: Test transaction validation
const testTr = view.state.tr;
testTr.delete(nodeStart, nodeEnd);
const testDoc = testTr.doc;
// ⚠️ Document có thể đã thay đổi khi mouseUp được gọi!
```

**Hậu quả:**
- Insert có thể fail mặc dù đã pass validation
- Error có thể xảy ra khi dispatch transaction

---

### 4. **Node State Không Được Đồng Bộ**

**Vấn đề:**
- `dragPreviewNode` được capture ở mousedown (line 960) nhưng không được update
- Nếu node được modify trong lúc drag, `dragPreviewNode` sẽ stale
- `nodeSize` được lấy một lần nhưng có thể thay đổi

**Vị trí code:**
```typescript
// Line 959-960: Node được capture một lần
dragPreviewNode = nodeAtPos; // ⚠️ Node này có thể đã thay đổi!
```

**Hậu quả:**
- Attributes mới của node có thể bị mất khi drag
- Node size mismatch có thể gây ra position calculation sai

---

### 5. **Edge Cases Không Được Handle**

**Vấn đề:**
- Drag vào empty document
- Drag vào position giữa 2 nodes không thể chứa image
- Drag khi document đang được modify bởi operation khác
- Drag vào nested structures (tables, lists, etc.)

**Hậu quả:**
- Insert có thể fail silently
- Image có thể bị mất hoặc insert vào vị trí sai
- UI có thể bị inconsistent state

---

## ✅ Giải Pháp Tối Ưu

### Giải pháp 1: Sử dụng ProseMirror's Built-in Drag & Drop

**Ưu điểm:**
- ProseMirror có built-in support cho drag & drop
- Đã được test kỹ và handle tất cả edge cases
- Tự động sync với document state

**Implementation:**
```typescript
// Thay vì custom drag logic, sử dụng ProseMirror's handleDrop
addProseMirrorPlugins() {
  return [
    new Plugin({
      props: {
        handleDrop: (view, event, slice, moved) => {
          if (moved) {
            // ProseMirror đã handle move, chỉ cần update selection
            return true;
          }
          return false;
        },
      },
    }),
  ];
}
```

---

### Giải pháp 2: Cải Thiện Logic Hiện Tại (Nếu muốn giữ custom logic)

#### 2.1. Lock State và Prevent Race Conditions

```typescript
let dragState: {
  isActive: boolean;
  startPos: number;
  node: PMNode;
  nodeSize: number;
  nodeId: string;
  startTime: number;
} | null = null;

const startDrag = (pos: number) => {
  if (dragState?.isActive) {
    console.warn('Drag already in progress');
    return false;
  }
  
  const { doc } = view.state;
  const node = doc.nodeAt(pos);
  if (!node || node.type.name !== 'image') {
    return false;
  }
  
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
  // Strategy: Try exact position first, then search nearby
  const positionsToTry = [
    clampedPos,
    clampedPos - 1,
    clampedPos + 1,
    ...generateNearbyPositions(clampedPos, 10), // ±10 positions
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
  insertPos: number
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
    // This shouldn't happen, but handle it
    finalInsertPos = nodeStart;
  }
  
  // 4. Validate final position
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
const cleanupDrag = () => {
  if (dragState) {
    dragState.isActive = false;
    dragState = null;
  }
  
  removeDragPreview();
  isDragging = false;
  dragStartPos = undefined;
  pendingInsertPos = null;
  // ... other cleanup
};

// Wrap trong try-catch và ensure cleanup
const handleDocumentMouseUp = () => {
  try {
    if (dragState?.isActive && pendingInsertPos !== null) {
      const success = performDragDrop(dragState, pendingInsertPos);
      if (!success) {
        console.warn('Drag drop failed, node not moved');
      }
    }
  } catch (error) {
    console.error('Error in drag drop:', error);
  } finally {
    cleanupDrag();
  }
};
```

---

## 📊 So Sánh Giải Pháp

| Tiêu chí | Custom Logic (Hiện tại) | ProseMirror Built-in | Improved Custom Logic |
|---------|---------------------------|---------------------|----------------------|
| Độ phức tạp | ⚠️ Rất cao | ✅ Thấp | ⚠️ Trung bình |
| Độ tin cậy | ⚠️ Thấp (nhiều bugs) | ✅ Rất cao | ✅ Cao |
| Performance | ✅ Tốt | ✅ Tốt | ✅ Tốt |
| Maintainability | ⚠️ Khó maintain | ✅ Dễ maintain | ⚠️ Trung bình |
| Flexibility | ✅ Rất linh hoạt | ⚠️ Hạn chế | ✅ Linh hoạt |

---

## 🎯 Khuyến Nghị

**Nên sử dụng ProseMirror's built-in drag & drop** vì:
1. Đã được test kỹ và handle tất cả edge cases
2. Tự động sync với document state
3. Dễ maintain hơn
4. Ít bugs hơn

**Nếu cần custom logic**, thì:
1. Implement lock mechanism để prevent race conditions
2. Simplify position calculation logic
3. Add comprehensive validation
4. Ensure atomic transactions
5. Add proper error handling và cleanup

---

## 🔧 Code Refactor Mẫu

Xem file `TiptapEditor.refactored.tsx` để xem implementation đầy đủ của giải pháp cải thiện.

