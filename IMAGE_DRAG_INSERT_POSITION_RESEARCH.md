## Research: Image Drag & Insert Position in ProseMirror / Tiptap

### 1. Goals & Constraints

- **Goals**
  - Reorder/move image nodes with drag & drop.
  - Compute an insert position that matches user expectations:
    - Drop before/after the nearest image when hovering between images.
    - Drop into the nearest text block position when not over an image.
  - Keep behavior stable when the document is large and contains many images / blocks.
  - Allow normal scrolling (wheel / touchpad) while dragging.

- **Constraints**
  - ProseMirror document is a tree; positions are integer offsets in `doc.content`.
  - Not every numeric position is a valid place to insert an `image` node
    (`parent.canReplace` must be checked).
  - HTML5 native drag is problematic:
    - Often blocks wheel scroll.
    - Shows browser ghost preview.
    - Coordinates are less controllable in complex editors.
  - We want **mouse-based drag (mousedown/mousemove/mouseup)** and custom preview,
    not relying on HTML5 drag.

---

### 2. High-level Approach for Insert Position

Most high-quality ProseMirror/Tiptap implementations follow some variation of:

1. **Track the dragged node**
   - Capture the `PMNode`, its `pos`, and `nodeSize` when the drag starts.
   - Optionally also track a stable `id` attribute on the node (`attrs.id`).

2. **On mouse move / drag move**
   - Convert current pointer coordinates to a ProseMirror position:
     - `const coords = view.posAtCoords({ left: clientX, top: clientY })`
     - `const targetPos = coords?.pos ?? null`

3. **Map targetPos to an *insert position***
   - If hovering near another image:
     - Decide **before** or **after** that image based on the cursor relative to
       the image center.
   - Else:
     - Use a generic search around `targetPos` to find the closest position where
       an `image` node is allowed (`parent.canReplace`).

4. **Perform the move in a single transaction**
   - Delete the original node range `[fromPos, fromPos + nodeSize)`.
   - Adjust the candidate insert position (because the deletion shifts positions).
   - Validate and insert the node at the new position.
   - Optionally set selection on the moved node for visual feedback.

5. **Guard rails**
   - If the candidate insert position falls *inside* the original node range,
     abort (no-op).
   - If `canReplace` at that position fails, either:
     - Fallback to a nearby allowed position, or
     - Abort gracefully.

This is exactly the pattern the previous `findInsertPosition` helper in your file
is already following, but originally it was tightly coupled with HTML5 drag state.

---

### 3. Existing Logic in `TiptapEditor.tsx`

You already have two key pieces:

1. **`findInsertPosition(targetPos, dragState, doc)`**
   - Walks the document:
     - Builds a cached list of all other `image` nodes
       (`cachedImageNodes: { pos, size, center }[]`),
       excluding the dragged image (by `nodeId`).
     - If `targetPos` lies inside another image range, chooses that as target.
     - Else finds the **nearest image** in terms of position/center.
     - Uses a **DROP_ZONE_THRESHOLD** to decide whether to snap to the nearest image.
   - Chooses a final `insertPos`:
     - If dragging from *behind* an image, drop **before** it.
     - If dragging from *in front of* an image, drop **after** it.
   - Verifies the insert position:
     - Uses `doc.resolve(insertPos)` and `parent.canReplace(index, index, Fragment.from(dragState.node))`.
   - Fallback: if no image is close enough, scans around `clampedPos` with a
     small radius looking for any valid `parent.canReplace` position.

2. **New `moveImageNode(fromPos, clientX, clientY)`**
   - Gets `coords = view.posAtCoords({ left: clientX, top: clientY })`.
   - Builds a temporary `DragState` with `startPos`, `node`, `nodeSize`, `nodeId`.
   - Calls `findInsertPosition(targetPos, tempDragState, doc)` to get `insertPos`.
   - In one transaction:
     - Deletes the original node range.
     - Adjusts `finalInsertPos` (if after original pos).
     - Checks `canReplace` again post-delete.
     - Inserts the node and sets selection.

This is a **good design**: you are reusing a robust insert-position finder and
decoupling it from HTML5 drag.

---

### 4. Insert-position Strategies (What We Want)

Below are common strategies (and how they map to your implementation):

- **A. Image-to-image drag (same block)**
  - If pointer is between image A and B, choose closest image.
  - If pointer is left of center of target image → insert before it.
  - If pointer is right of center → insert after it.
  - Your `findInsertPosition` + `DROP_ZONE_THRESHOLD` already does:
    - Build list of image centers.
    - Pick nearest.
    - Decide before/after based on `clampedPos` vs `center`.

- **B. Image drag into text**
  - If pointer is not near any image (no match, or `distance > DROP_ZONE_THRESHOLD`):
    - Try to find a valid `canReplace` position near `targetPos`,
      scanning forward/backward within `MAX_SEARCH_RADIUS`.
  - This allows:
    - Dropping image at top or bottom of a paragraph.
    - Dropping into empty paragraphs.
  - Your fallback loop (`for offset in 0..MAX_SEARCH_RADIUS`) already implements this.

- **C. Preventing “self-drop”**
  - If candidate position is inside original node `[fromPos, fromEnd)`, skip.
  - Already handled both in `findInsertPosition` (clamped pos checks) and in `moveImageNode`
    by early returns.

- **D. Validity checks**
  - Use `parent.canReplace` wherever we might insert:
    - Once in `findInsertPosition` (working on original `doc`).
    - Once again in `moveImageNode` after deleting the node, because the structure changes.

---

### 5. Potential Simplifications / Cleanups

**a) Make `DragState` local to insert-position logic only**

Currently `DragState` is declared near node view, but in the new mouse-based
drag we mostly use only:

- `startPos`
- `node`
- `nodeSize`
- `nodeId`

We can:

- Keep `DragState` type, but limit its use to `moveImageNode` and `findInsertPosition`.
- Remove old HTML5-drag-only fields from the type if they’re no longer needed
  (`startTime`, `pendingInsertPos`, `lastMovedToPos`).

**b) Narrow the responsibilities**

- `handleImageMouseDown`:
  - Only decides whether we are dragging or clicking.
  - Updates UI (preview, opacity, cursor).
  - Calls `moveImageNode` on mouseup if we dragged.

- `moveImageNode`:
  - Does **only** document transformation and selection.
  - No DOM/UI side effects.

- `findInsertPosition`:
  - Computes the best `insertPos` given `(targetPos, node, startPos, doc)`.
  - Does not mutate transaction or global state.

This is already close to how your code is shaped; only minor refactors are needed.

---

### 6. Proposed Clean `DragState` & Insert Position API

We can refactor to this minimal shape:

```ts
type ImageDragContext = {
  startPos: number;
  id: string;
  node: PMNode;
  nodeSize: number;
};

function findImageInsertPos(
  targetPos: number,
  ctx: ImageDragContext,
  doc: PMNode,
): number | null {
  // essentially your current findInsertPosition, but using ctx instead of DragState
}

function moveImageNodeByCoords(
  view: EditorView,
  fromPos: number,
  clientX: number,
  clientY: number,
): void {
  const { state, dispatch } = view;
  const { doc } = state;

  const node = doc.nodeAt(fromPos);
  if (!node || node.type.name !== 'image') return;

  const id = node.attrs.id;
  if (!id) return;

  const coords = view.posAtCoords({ left: clientX, top: clientY });
  if (!coords) return;

  const ctx: ImageDragContext = {
    startPos: fromPos,
    id,
    node,
    nodeSize: node.nodeSize,
  };

  const insertPos = findImageInsertPos(coords.pos, ctx, doc);
  if (insertPos === null || insertPos === fromPos) return;

  const tr = state.tr;
  const fromEnd = fromPos + node.nodeSize;

  tr.delete(fromPos, fromEnd);

  let finalInsertPos = insertPos;
  if (finalInsertPos > fromPos) {
    finalInsertPos -= node.nodeSize;
  }

  finalInsertPos = Math.max(0, Math.min(finalInsertPos, tr.doc.content.size));

  try {
    const $pos = tr.doc.resolve(finalInsertPos);
    const parent = $pos.parent;
    const index = $pos.index();
    if (!parent.canReplace(index, index, Fragment.from(node))) return;
  } catch {
    return;
  }

  const newNode = node.type.create(node.attrs, node.content);
  tr.insert(finalInsertPos, newNode);

  const newDoc = tr.doc;
  const movedNode = newDoc.nodeAt(finalInsertPos);
  if (movedNode && movedNode.type.name === 'image' && movedNode.attrs.id === id) {
    tr.setSelection(
      TextSelection.create(
        newDoc,
        finalInsertPos,
        finalInsertPos + movedNode.nodeSize,
      ),
    );
  }

  dispatch(tr);
}
```

This matches exactly what we’re doing now, but:

- The drag **context** is a simple struct (`ImageDragContext`).
- `findImageInsertPos` becomes easier to test/maintain.
- `moveImageNodeByCoords` encapsulates all ProseMirror transaction handling.

---

### 7. Implementation Notes for Your Current Code

Given your current `TiptapEditor.tsx`:

- You already have:
  - `findInsertPosition(targetPos, dragState, doc)` – rename to `findImageInsertPos`
    in the future for clarity.
  - `moveImageNode` – now calling `findInsertPosition` and handling the transaction.
  - Mouse-based drag (`handleImageMouseDown`) that:
    - Creates a preview via `createDragPreview`.
    - Updates its position via `updateDragPreviewPosition`.
    - Calls `moveImageNode` on mouseup if drag occurred.

**Recommended next cleanups (optional, not yet done in code):**

1. Trim the `DragState` type to only what `findInsertPosition` needs.
2. Rename `DragState` → `ImageDragContext` and pass that instead.
3. Drop unused global C-like flags that were only for HTML5 drag (`globalImageDragState`).
4. Move the drag-related helpers (`moveImageNode`, `findInsertPosition`, preview helpers)
   into a small utility module when the file gets too big.

---

### 8. Summary

- The core of a **correct, clean, and optimal insert-position algorithm** in ProseMirror
  is:
  - Using `posAtCoords` to get a candidate position.
  - Using document analysis (`descendants`) + geometric reasoning (centers, thresholds)
    to find the best target node (usually another image).
  - Using `canReplace` to check structural validity.
  - Applying delete + insert in a single ProseMirror transaction.
- Your current implementation already follows these best practices; most remaining work
  is **refinement and cleanup**, not changing the fundamental algorithm.




