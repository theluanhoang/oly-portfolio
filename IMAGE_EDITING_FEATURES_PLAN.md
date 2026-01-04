# Kế hoạch triển khai tính năng chỉnh sửa ảnh cho Blog Editor

## 📋 Phân tích các tính năng từ Blog Editor phổ biến

### 1. WordPress Gutenberg
- ✅ Resize ảnh (kéo thả góc)
- ✅ Căn lề ảnh (trái, giữa, phải, full width)
- ✅ Alt text và caption
- ✅ Link ảnh
- ✅ Crop ảnh (cắt ảnh)
- ✅ Replace ảnh (thay thế)
- ✅ Xóa ảnh
- ⚠️ Chỉnh sửa nâng cao (brightness, contrast) - qua plugin

### 2. Medium Editor
- ✅ Resize ảnh
- ✅ Căn lề ảnh (full width, wide, normal)
- ✅ Caption
- ✅ Drag & drop để sắp xếp
- ❌ Không có crop/edit trực tiếp

### 3. Notion
- ✅ Resize ảnh
- ✅ Căn lề ảnh
- ✅ Caption
- ✅ Replace ảnh
- ✅ Xóa ảnh
- ❌ Không có crop/edit trực tiếp

### 4. Ghost Editor
- ✅ Resize ảnh
- ✅ Căn lề ảnh
- ✅ Caption
- ✅ Alt text
- ✅ Link ảnh
- ✅ Replace ảnh
- ❌ Không có crop/edit trực tiếp

## 🎯 Tính năng cơ bản cần triển khai (Priority)

### Phase 1: Tính năng cơ bản (Must Have) ⭐⭐⭐
1. **Resize ảnh** ✅ (Đã có - cần cải thiện)
   - Hiện tại: Có resize handles 8 hướng
   - Cần thêm: Input field để nhập kích thước chính xác (width/height)
   - Cần thêm: Lock aspect ratio toggle
   - Cần thêm: Reset về kích thước gốc

2. **Căn lề ảnh** ⚠️ (Chưa có)
   - Left align
   - Center align
   - Right align
   - Full width
   - Float left/right (text wrap)

3. **Alt text & Caption** ⚠️ (Chưa có)
   - Alt text cho accessibility
   - Caption hiển thị dưới ảnh
   - Edit alt text và caption

4. **Link ảnh** ⚠️ (Chưa có)
   - Thêm link khi click vào ảnh
   - Edit/remove link

5. **Replace ảnh** ⚠️ (Chưa có)
   - Thay thế ảnh hiện tại bằng ảnh mới
   - Giữ nguyên kích thước và căn lề

6. **Xóa ảnh** ✅ (Có thể xóa bằng Delete key - cần thêm button)

### Phase 2: Tính năng nâng cao (Should Have) ⭐⭐
7. **Crop ảnh** ❌ (Chưa có)
   - Crop tool với preview
   - Aspect ratio presets (1:1, 16:9, 4:3, etc.)
   - Free crop
   - Lưu crop vào ảnh hoặc chỉ áp dụng khi render

8. **Rotate & Flip** ❌ (Chưa có)
   - Rotate 90°, 180°, 270°
   - Flip horizontal/vertical
   - Reset rotation

9. **Image alignment toolbar** ⚠️ (Chưa có)
   - Toolbar xuất hiện khi chọn ảnh
   - Quick actions: align, link, replace, delete

### Phase 3: Tính năng chuyên nghiệp (Nice to Have) ⭐
10. **Image filters** ❌ (Chưa có)
    - Brightness, Contrast, Saturation
    - Grayscale, Sepia
    - Blur, Sharpen
    - Áp dụng qua CSS filters (không thay đổi file gốc)

11. **Image effects** ❌ (Chưa có)
    - Border radius
    - Border (color, width, style)
    - Shadow
    - Opacity

12. **Image optimization** ❌ (Chưa có)
    - Compress ảnh trước khi upload
    - Convert format (WebP)
    - Lazy loading

## 📊 So sánh với codebase hiện tại

### ✅ Đã có:
- Resize ảnh với 8 handles (nw, ne, sw, se, n, s, e, w)
- Drag & drop để di chuyển ảnh
- Multiple image selection
- Image gallery layouts (grid, masonry, side-by-side, stacked)
- Upload từ computer
- Add image từ URL

### ⚠️ Cần cải thiện:
- Resize: Thêm input fields cho width/height chính xác
- Resize: Thêm lock aspect ratio
- Resize: Thêm reset về kích thước gốc

### ❌ Chưa có:
- Căn lề ảnh (align left/center/right/full)
- Alt text
- Caption
- Link ảnh
- Replace ảnh
- Crop ảnh
- Rotate & Flip
- Image toolbar khi chọn
- Image filters/effects

## 🚀 Kế hoạch triển khai chi tiết

### Phase 1: Tính năng cơ bản (2-3 tuần)

#### Week 1: Image Toolbar & Basic Actions
**Task 1.1: Tạo Image Toolbar Component**
- Tạo component `ImageToolbar.tsx`
- Toolbar xuất hiện khi chọn ảnh
- Position: floating, dưới ảnh hoặc bên cạnh
- Các button: Align, Link, Replace, Delete, More (dropdown)

**Task 1.2: Image Alignment**
- Thêm attribute `align` vào ResizableImage
- Values: 'left', 'center', 'right', 'full', 'float-left', 'float-right'
- CSS classes để style alignment
- Alignment buttons trong toolbar

**Task 1.3: Alt Text & Caption**
- Thêm attributes: `alt`, `caption`
- Dialog để edit alt text và caption
- Hiển thị caption dưới ảnh
- Validation: alt text required (accessibility)

**Task 1.4: Link Image**
- Thêm attribute `href` vào ResizableImage
- Dialog để thêm/edit link
- Click ảnh để mở link (nếu có)
- Visual indicator khi ảnh có link

**Task 1.5: Replace Image**
- Button trong toolbar
- Dialog: upload mới hoặc nhập URL
- Giữ nguyên attributes (width, height, align, alt, caption, href)

**Task 1.6: Delete Image**
- Button trong toolbar
- Confirm dialog
- Hoặc dùng Delete/Backspace key (đã có, cần cải thiện UX)

#### Week 2: Improve Resize & Image Attributes
**Task 2.1: Enhanced Resize**
- Thêm input fields cho width/height
- Lock aspect ratio toggle
- Reset to original size button
- Min/max constraints

**Task 2.2: Image Attributes Panel**
- Panel hiển thị khi chọn ảnh
- Hiển thị: dimensions, file size, alt text, caption, link
- Quick edit các attributes

**Task 2.3: Image Context Menu**
- Right-click menu
- Options: Edit, Replace, Delete, Copy, etc.

### Phase 2: Tính năng nâng cao (2-3 tuần)

#### Week 3: Crop & Transform
**Task 3.1: Crop Tool**
- Tích hợp thư viện: `react-easy-crop` hoặc `cropperjs`
- Crop dialog/modal
- Aspect ratio presets
- Preview crop
- Apply crop (có thể tạo ảnh mới hoặc dùng CSS clip-path)

**Task 3.2: Rotate & Flip**
- Rotate buttons: 90°, 180°, 270°
- Flip buttons: horizontal, vertical
- Thêm attributes: `rotation`, `flipH`, `flipV`
- Apply qua CSS transform

#### Week 4: Image Effects & Filters
**Task 4.1: CSS Filters**
- Brightness, Contrast, Saturation sliders
- Grayscale, Sepia toggles
- Blur, Sharpen
- Lưu vào attributes, apply qua CSS

**Task 4.2: Image Effects**
- Border radius slider
- Border (color picker, width, style)
- Shadow (color, blur, offset)
- Opacity slider

### Phase 3: Optimization & Polish (1-2 tuần)

**Task 5.1: Image Optimization**
- Client-side compression trước khi upload
- Convert to WebP (nếu browser support)
- Lazy loading cho ảnh

**Task 5.2: Performance & UX**
- Optimize image rendering
- Loading states
- Error handling
- Keyboard shortcuts

**Task 5.3: Documentation & Testing**
- Viết documentation
- Unit tests
- Integration tests
- User testing

## 🛠️ Công nghệ & Thư viện đề xuất

### Image Editing Libraries:
1. **react-easy-crop** - Crop ảnh (lightweight, React-friendly)
2. **cropperjs** - Crop ảnh (more features, vanilla JS)
3. **fabric.js** - Advanced editing (overkill cho blog editor)
4. **browser-image-compression** - Compress ảnh

### Recommended:
- **react-easy-crop** cho crop (đơn giản, dễ tích hợp)
- **browser-image-compression** cho optimization
- CSS filters cho effects (không cần thư viện)

## 📝 Implementation Notes

### Data Structure:
```typescript
interface ImageAttributes {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right' | 'full' | 'float-left' | 'float-right';
  href?: string;
  rotation?: number; // 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    grayscale?: boolean;
    sepia?: boolean;
    blur?: number;
  };
  effects?: {
    borderRadius?: number;
    border?: {
      width: number;
      color: string;
      style: string;
    };
    shadow?: string;
    opacity?: number;
  };
}
```

### Component Structure:
```
components/admin/
  ├── TiptapEditor.tsx (main editor)
  ├── ImageToolbar.tsx (toolbar khi chọn ảnh)
  ├── ImageAttributesPanel.tsx (panel hiển thị attributes)
  ├── ImageCropDialog.tsx (crop dialog)
  ├── ImageEffectsPanel.tsx (filters & effects panel)
  └── ImageContextMenu.tsx (right-click menu)
```

## ✅ Checklist triển khai

### Phase 1:
- [ ] Image Toolbar component
- [ ] Image alignment (left/center/right/full/float)
- [ ] Alt text & Caption
- [ ] Link image
- [ ] Replace image
- [ ] Delete image button
- [ ] Enhanced resize (input fields, lock ratio, reset)
- [ ] Image attributes panel

### Phase 2:
- [ ] Crop tool
- [ ] Rotate & Flip
- [ ] CSS Filters (brightness, contrast, etc.)
- [ ] Image Effects (border, shadow, etc.)

### Phase 3:
- [ ] Image compression
- [ ] WebP conversion
- [ ] Lazy loading
- [ ] Performance optimization
- [ ] Documentation
- [ ] Testing

## 🎨 UI/UX Considerations

1. **Image Toolbar**: 
   - Floating, không che ảnh
   - Responsive, mobile-friendly
   - Keyboard accessible

2. **Dialogs/Modals**:
   - Consistent với design system hiện tại
   - Clear actions (Cancel/Apply)
   - Keyboard shortcuts (Esc to close)

3. **Visual Feedback**:
   - Highlight khi chọn ảnh
   - Loading states
   - Error messages
   - Success confirmations

4. **Accessibility**:
   - Alt text required
   - Keyboard navigation
   - Screen reader support
   - ARIA labels

## 📚 References

- [Tiptap Image Extension](https://tiptap.dev/api/nodes/image)
- [react-easy-crop](https://github.com/ricardo-ch/react-easy-crop)
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
- [WordPress Gutenberg Image Block](https://wordpress.org/gutenberg/)
- [Medium Image Guidelines](https://help.medium.com/hc/en-us/articles/115011350667-Images)

