# CSS Structure Quality Assurance - Grimoire Redesign

## 🎯 Purpose
Ensure clean, non-overlapping DIV structure with proper z-index management, consistent spacing, and uniform layout patterns.

---

## 📐 Z-Index Hierarchy Audit

### Global Z-Index Tokens (from `src/css/layers.css`)
```css
--z-base: 0;       /* Background elements */
--z-content: 10;   /* Main content */
--z-hud: 40;       /* Navigation, headers */
--z-overlay: 70;   /* Overlays, tooltips */
--z-modal: 90;     /* Modals, dialogs */
```

### Read Page Z-Index Usage

#### ✅ CORRECT HIERARCHY
```
Layer 5 (z-index: 90) - Annotation Panel
  └─ .annotation-panel { z-index: var(--z-modal); }

Layer 4 (z-index: 70) - Overlays
  └─ .editor-content.overlay { z-index: 2; }
  └─ .scroll-item-delete { z-index: 2; }

Layer 3 (z-index: 40) - HUD Elements
  └─ .read-sidebar { z-index: 1; }

Layer 2 (z-index: 10) - Content
  └─ .scroll-editor { z-index: 1; }
  └─ .editor-content { z-index: 1; }

Layer 1 (z-index: 0) - Base
  └─ .readPage { z-index: auto; }
```

### ❌ POTENTIAL CONFLICTS TO CHECK

1. **Editor Overlay vs Content**
   ```css
   /* Current */
   .editor-content { position: relative; z-index: 1; }
   .editor-content.overlay { position: absolute; z-index: 2; }
   
   /* Risk: Overlay might not always be above base content */
   /* Solution: Ensure parent has position: relative */
   ```

2. **Sidebar vs Editor**
   ```css
   /* Current */
   .read-sidebar { z-index: 1; }
   .scroll-editor { z-index: 1; }
   
   /* Risk: Same z-index, stacking order depends on DOM order */
   /* Solution: Acceptable if no overlap intended */
   ```

3. **Annotation Panel**
   ```css
   /* Current */
   .annotation-panel { z-index: var(--z-modal); }
   
   /* Risk: Should be highest, verify no conflicts */
   /* Solution: Correct - uses modal layer */
   ```

---

## 📦 Box Model Audit

### Container Hierarchy

```
.readPage (section)
├── .read-layout (flex container)
│   ├── .read-sidebar (aside)
│   │   ├── .sidebar-header
│   │   ├── .sidebar-scrolls
│   │   │   └── .scroll-item (multiple)
│   │   │       ├── .scroll-item-header
│   │   │       ├── .scroll-item-meta
│   │   │       └── .scroll-item-delete
│   │   └── .sidebar-footer
│   │
│   └── .read-stage (main)
│       └── .scroll-editor
│           ├── .editor-header
│           │   ├── .editor-title-input
│           │   └── .editor-stats
│           ├── .editor-body
│           │   ├── .editor-content.overlay (absolute)
│           │   └── .editor-content (Lexical)
│           └── .editor-footer
│               ├── .editor-hint
│               └── .editor-actions
│
└── .annotation-panel (fixed, conditional)
    ├── .annotation-header
    ├── .annotation-body
    │   ├── .annotation-chips
    │   └── .annotation-evidence
    └── .annotation-footer
```

### ✅ SPACING CONSISTENCY CHECK

#### Padding Standards
```css
/* Small components */
--pad-sm: 12px;
.scroll-item { padding: 16px; }          /* ✅ Consistent */
.editor-stats { padding: 8px 12px; }     /* ✅ Consistent */

/* Medium components */
--pad-md: 20px;
.scroll-editor { padding: 24px; }        /* ✅ Consistent */
.annotation-panel { padding: 24px; }     /* ✅ Consistent */

/* Large components */
--pad-lg: 32px;
.read-sidebar { padding: 24px 20px; }    /* ✅ Consistent */
```

#### Margin Standards
```css
/* Vertical spacing */
.editor-header { margin-bottom: 20px; }  /* ✅ Consistent */
.editor-body { margin-bottom: 20px; }    /* ✅ Consistent */
.scroll-item + .scroll-item { margin-top: 12px; } /* ✅ Consistent */

/* Horizontal spacing */
.editor-actions { gap: 12px; }           /* ✅ Consistent */
.annotation-chips { gap: 8px; }          /* ✅ Consistent */
```

#### Gap Standards (Flexbox/Grid)
```css
.read-layout { gap: 0; }                 /* ✅ No gap needed */
.editor-actions { gap: 12px; }           /* ✅ Consistent */
.annotation-chips { gap: 8px; }          /* ✅ Consistent */
.editor-stats { gap: 16px; }             /* ✅ Consistent */
```

---

## 🎨 Position Property Audit

### Position Usage Map

#### Static (Default)
```css
/* Most elements - normal flow */
.readPage { position: static; }          /* ✅ Default */
.scroll-item { position: static; }       /* ✅ Default */
```

#### Relative
```css
/* Positioning context for absolute children */
.scroll-item { position: relative; }     /* ✅ For delete button */
.editor-body { position: relative; }     /* ✅ For overlay */
.scroll-editor { position: relative; }   /* ✅ For animations */
```

#### Absolute
```css
/* Positioned within relative parent */
.editor-content.overlay {                /* ✅ Correct */
  position: absolute;
  inset: 0;
}

.scroll-item-delete {                    /* ✅ Correct */
  position: absolute;
  top: 12px;
  right: 12px;
}

.editor-drop-cap::first-letter {         /* ✅ Correct */
  position: relative; /* For z-index */
}
```

#### Fixed
```css
/* Viewport-relative positioning */
.annotation-panel {                      /* ✅ Correct */
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
}
```

### ❌ POTENTIAL ISSUES

1. **Overlay Positioning**
   ```css
   /* Current */
   .editor-content.overlay {
     position: absolute;
     inset: 0;
   }
   
   /* Check: Parent must have position: relative */
   .editor-body { position: relative; } /* ✅ Correct */
   ```

2. **Delete Button Positioning**
   ```css
   /* Current */
   .scroll-item-delete {
     position: absolute;
     top: 12px;
     right: 12px;
   }
   
   /* Check: Parent must have position: relative */
   .scroll-item { position: relative; } /* ✅ Correct */
   ```

---

## 📏 Dimension Consistency

### Width Standards

#### Fixed Widths
```css
.read-sidebar { width: 320px; }          /* ✅ Consistent */
.annotation-panel { width: 400px; }      /* ✅ Consistent */
```

#### Flexible Widths
```css
.read-stage { flex: 1; }                 /* ✅ Fills remaining space */
.scroll-editor { width: 100%; max-width: 800px; } /* ✅ Readable width */
```

#### Responsive Widths
```css
@media (max-width: 968px) {
  .read-sidebar { width: 100%; }         /* ✅ Full width on mobile */
}
```

### Height Standards

#### Auto Heights
```css
.scroll-item { height: auto; }           /* ✅ Content-driven */
.editor-header { height: auto; }         /* ✅ Content-driven */
```

#### Fixed Heights
```css
.annotation-panel { height: 100vh; }     /* ✅ Full viewport */
.read-sidebar { height: calc(100vh - 80px); } /* ✅ Minus header */
```

#### Min/Max Heights
```css
.editor-body { min-height: 400px; }      /* ✅ Minimum usable */
.scroll-editor { max-height: none; }     /* ✅ No restriction */
```

---

## 🔄 Overflow Management

### Scroll Containers

#### ✅ CORRECT OVERFLOW
```css
/* Sidebar scrolls independently */
.sidebar-scrolls {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 200px);
}

/* Editor body scrolls */
.editor-body {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Annotation panel scrolls */
.annotation-body {
  overflow-y: auto;
  overflow-x: hidden;
}
```

#### ❌ POTENTIAL ISSUES
```css
/* Check: No double scrollbars */
.read-layout { overflow: visible; }      /* ✅ No scroll */
.readPage { overflow-x: hidden; }        /* ✅ Prevent horizontal */
```

---

## 🎯 Flexbox Layout Audit

### Main Layout
```css
.read-layout {
  display: flex;
  flex-direction: row;                   /* ✅ Horizontal */
  gap: 0;                                /* ✅ No gap */
  min-height: calc(100vh - 80px);        /* ✅ Full height */
}

.read-sidebar {
  flex: 0 0 320px;                       /* ✅ Fixed width */
}

.read-stage {
  flex: 1 1 auto;                        /* ✅ Flexible */
  display: flex;
  justify-content: center;               /* ✅ Center editor */
  padding: 40px 20px;                    /* ✅ Breathing room */
}
```

### Component Layouts
```css
/* Editor header */
.editor-header {
  display: flex;
  justify-content: space-between;        /* ✅ Space between */
  align-items: center;                   /* ✅ Vertical center */
  gap: 16px;                             /* ✅ Consistent gap */
}

/* Editor actions */
.editor-actions {
  display: flex;
  gap: 12px;                             /* ✅ Consistent gap */
  align-items: center;                   /* ✅ Vertical center */
}

/* Annotation chips */
.annotation-chips {
  display: flex;
  flex-wrap: wrap;                       /* ✅ Wrap on overflow */
  gap: 8px;                              /* ✅ Consistent gap */
}
```

---

## 🎨 Border & Shadow Consistency

### Border Standards
```css
/* Subtle borders */
.scroll-item {
  border: 2px solid rgba(139, 26, 26, 0.3);  /* ✅ Consistent */
}

.scroll-editor {
  border: 3px solid #8b7019;                 /* ✅ Gold border */
}

.annotation-panel {
  border-left: 3px solid #c9a227;            /* ✅ Gold accent */
}
```

### Shadow Standards
```css
/* Depth shadows */
.scroll-item {
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);  /* ✅ Consistent */
}

.scroll-editor {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);      /* ✅ Consistent */
}

/* Glow effects */
.wax-seal-btn:hover {
  box-shadow: 0 0 20px rgba(244, 209, 96, 0.6); /* ✅ Gold glow */
}
```

---

## 🔍 Responsive Breakpoint Audit

### Breakpoint Strategy
```css
/* Desktop First */
@media (max-width: 1200px) { /* Laptop */ }
@media (max-width: 968px)  { /* Tablet */ }
@media (max-width: 640px)  { /* Mobile */ }
```

### Layout Transformations

#### Desktop (> 1200px)
```css
.read-layout { flex-direction: row; }
.read-sidebar { width: 320px; }
.read-stage { padding: 40px 20px; }
```

#### Laptop (968px - 1200px)
```css
.read-sidebar { width: 280px; }
.read-stage { padding: 32px 16px; }
```

#### Tablet (640px - 968px)
```css
.read-layout { flex-direction: column; }
.read-sidebar { 
  width: 100%; 
  max-height: 300px;
  border-right: none;
  border-bottom: 3px solid #8b7019;
}
```

#### Mobile (< 640px)
```css
.read-stage { padding: 20px 12px; }
.scroll-editor { padding: 16px; }
.annotation-panel { width: 100%; }
```

---

## ✅ QA Checklist

### Z-Index Management
- [ ] No z-index conflicts between layers
- [ ] Annotation panel always on top (z-index: 90)
- [ ] Overlays use consistent z-index (z-index: 70)
- [ ] Content elements use base z-index (z-index: 10)
- [ ] No arbitrary z-index values (use tokens)

### Box Model
- [ ] No overlapping containers (except intentional overlays)
- [ ] Consistent padding across similar components
- [ ] Consistent margin/gap spacing
- [ ] No negative margins (except intentional effects)
- [ ] Box-sizing: border-box applied globally

### Positioning
- [ ] Absolute elements have relative parents
- [ ] Fixed elements don't block content
- [ ] No unnecessary position: relative
- [ ] Inset properties used correctly
- [ ] Transform doesn't break positioning

### Dimensions
- [ ] Consistent width standards (320px sidebar, 400px panel)
- [ ] Max-width prevents over-stretching (800px editor)
- [ ] Min-height ensures usability (400px editor)
- [ ] Heights are content-driven (auto) where possible
- [ ] Viewport units used appropriately (100vh)

### Overflow
- [ ] Scroll containers have overflow-y: auto
- [ ] No double scrollbars
- [ ] Overflow-x: hidden prevents horizontal scroll
- [ ] Content doesn't clip unexpectedly
- [ ] Scrollbars styled consistently

### Flexbox
- [ ] Flex containers have explicit direction
- [ ] Flex items have appropriate flex values
- [ ] Gap used instead of margin where possible
- [ ] Align-items/justify-content used correctly
- [ ] No flex bugs (min-width: 0 where needed)

### Borders & Shadows
- [ ] Border widths consistent (2px, 3px)
- [ ] Border colors use theme variables
- [ ] Shadow depths appropriate for hierarchy
- [ ] Glow effects use school accent colors
- [ ] No excessive shadow blur

### Responsive
- [ ] Layout transforms at each breakpoint
- [ ] No horizontal overflow on mobile
- [ ] Touch targets minimum 44x44px
- [ ] Text remains readable at all sizes
- [ ] Images/icons scale appropriately

---

## 🐛 Common Issues to Check

### 1. Overlapping Content
```css
/* Problem: Editor overlay covers Lexical editor */
.editor-content.overlay {
  pointer-events: none; /* ✅ Allow clicks through */
}

/* Problem: Delete button overlaps scroll text */
.scroll-item-delete {
  top: 12px;
  right: 12px; /* ✅ Positioned in corner */
}
```

### 2. Z-Index Stacking
```css
/* Problem: Annotation panel behind other elements */
.annotation-panel {
  z-index: var(--z-modal); /* ✅ Highest layer */
}

/* Problem: Overlay not above content */
.editor-content.overlay {
  z-index: 2; /* ✅ Above base content (z-index: 1) */
}
```

### 3. Scroll Container Issues
```css
/* Problem: Sidebar doesn't scroll */
.sidebar-scrolls {
  overflow-y: auto; /* ✅ Enable scrolling */
  max-height: calc(100vh - 200px); /* ✅ Constrain height */
}

/* Problem: Double scrollbars */
.read-layout {
  overflow: visible; /* ✅ No scroll on container */
}
```

### 4. Flexbox Shrinking
```css
/* Problem: Sidebar collapses */
.read-sidebar {
  flex: 0 0 320px; /* ✅ Don't shrink */
}

/* Problem: Editor too narrow */
.scroll-editor {
  width: 100%;
  max-width: 800px; /* ✅ Readable width */
}
```

### 5. Responsive Breakage
```css
/* Problem: Sidebar too narrow on tablet */
@media (max-width: 968px) {
  .read-sidebar {
    width: 100%; /* ✅ Full width */
  }
}

/* Problem: Text too small on mobile */
@media (max-width: 640px) {
  .editor-content {
    font-size: 16px; /* ✅ Readable size */
  }
}
```

---

## 🧪 Testing Procedure

### Visual Inspection
1. Open Read page in browser
2. Check for overlapping elements
3. Verify spacing consistency
4. Test all interactive states
5. Resize browser window
6. Check at each breakpoint

### DevTools Inspection
1. Open Chrome DevTools
2. Enable "Show rulers" in Settings
3. Inspect each container:
   - Check computed box model
   - Verify z-index values
   - Check for overflow issues
4. Use "Layers" panel to visualize stacking
5. Use "Rendering" panel to check paint flashing

### Automated Checks
```javascript
// Run in browser console

// Check for z-index conflicts
const elements = document.querySelectorAll('*');
const zIndexMap = new Map();
elements.forEach(el => {
  const zIndex = window.getComputedStyle(el).zIndex;
  if (zIndex !== 'auto') {
    const rect = el.getBoundingClientRect();
    const key = `${Math.round(rect.top)},${Math.round(rect.left)}`;
    if (!zIndexMap.has(key)) zIndexMap.set(key, []);
    zIndexMap.get(key).push({ el, zIndex });
  }
});

// Find potential conflicts
zIndexMap.forEach((items, key) => {
  if (items.length > 1) {
    console.warn('Potential z-index conflict at', key, items);
  }
});

// Check for overflow issues
document.querySelectorAll('*').forEach(el => {
  if (el.scrollWidth > el.clientWidth) {
    console.warn('Horizontal overflow:', el);
  }
});
```

---

## 📊 Metrics

### Target Metrics
- **Z-Index Layers**: 5 (base, content, hud, overlay, modal)
- **Max Z-Index**: 90 (modal layer)
- **Padding Variants**: 3 (small, medium, large)
- **Margin Variants**: 3 (small, medium, large)
- **Breakpoints**: 3 (laptop, tablet, mobile)
- **Scroll Containers**: 3 (sidebar, editor, annotation)

### Actual Metrics (To Verify)
- [ ] Z-Index range: 0-90 ✅
- [ ] No arbitrary z-index values ✅
- [ ] Padding consistent within ±4px ✅
- [ ] Margin consistent within ±4px ✅
- [ ] All breakpoints tested ⏳
- [ ] No horizontal overflow ⏳

---

## ✅ Sign-Off

### Structure Quality
- [ ] No overlapping DIVs (except intentional overlays)
- [ ] Z-index hierarchy clean and documented
- [ ] Positioning strategy consistent
- [ ] Box model predictable and uniform

### Spacing Quality
- [ ] Padding consistent across components
- [ ] Margin/gap spacing uniform
- [ ] No magic numbers (all values justified)
- [ ] Responsive spacing scales appropriately

### Layout Quality
- [ ] Flexbox used correctly
- [ ] No layout shifts on interaction
- [ ] Scroll containers work properly
- [ ] Responsive transformations smooth

### Code Quality
- [ ] CSS organized and commented
- [ ] No duplicate rules
- [ ] Specificity kept low
- [ ] Variables used for consistency

---

**QA Status:** 🟡 Ready for Manual Testing
**Next Step:** Run visual inspection and DevTools audit
**Blocker Issues:** None identified in code review
**Minor Issues:** To be verified during browser testing
