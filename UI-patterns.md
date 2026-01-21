# UI Patterns & Design System

This document describes all visual patterns, components, spacing, typography, and design tokens used in the CoworkForEnterprise (Copilot for Goals) project. Use this as a reference when implementing similar UI in other projects.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Layout Patterns](#layout-patterns)
6. [Component Patterns](#component-patterns)
7. [Icon System](#icon-system)
8. [Shadows & Effects](#shadows--effects)
9. [Animations](#animations)
10. [Responsive Design](#responsive-design)

---

## Technology Stack

- **CSS Framework**: Tailwind CSS v4
- **Font**: Inter (primary), system-ui fallback
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Markdown**: react-markdown
- **Framework**: React with TypeScript

---

## Color Palette

### Primary Colors (Indigo)

```
indigo-50:  #eef2ff  - Light backgrounds, hover states
indigo-100: #e0e7ff  - Icon backgrounds, subtle highlights
indigo-300: #a5b4fc  - Hover borders
indigo-500: #6366f1  - Focus rings
indigo-600: #4f46e5  - Primary buttons, links, accents
indigo-700: #4338ca  - Button hover states
```

### Neutral Colors (Gray)

```
gray-50:  #f9fafb  - Page background, alternate rows
gray-100: #f3f4f6  - Card hover backgrounds, dividers
gray-200: #e5e7eb  - Borders, dividers
gray-300: #d1d5db  - Input borders, disabled states
gray-400: #9ca3af  - Placeholder text, muted icons
gray-500: #6b7280  - Secondary text, descriptions
gray-600: #4b5563  - Table headers, labels
gray-700: #374151  - Secondary button text
gray-800: #1f2937  - Body text
gray-900: #111827  - Headings, primary text
```

### Semantic Colors

```
# Success (Green)
green-50:  #f0fdf4  - Success backgrounds
green-100: #dcfce7  - Success icon backgrounds
green-200: #bbf7d0  - Success badges
green-500: #22c55e  - Success indicators, checkmarks
green-600: #16a34a  - Success icons
green-700: #15803d  - Success text
green-800: #166534  - Success headings

# Warning (Amber/Orange)
amber-50:  #fffbeb  - Warning backgrounds
amber-100: #fef3c7  - Warning badges
amber-500: #f59e0b  - Warning icons
amber-600: #d97706  - Warning text
amber-700: #b45309  - Warning headings
orange-100: #ffedd5  - Alert backgrounds
orange-500: #f97316  - Alert icons

# Error (Red)
red-50:  #fef2f2  - Error backgrounds
red-100: #fee2e2  - Error highlights
red-200: #fecaca  - Error badges
red-500: #ef4444  - Error icons, delete actions
red-600: #dc2626  - Error text
red-700: #b91c1c  - Error headings
red-800: #991b1b  - Error emphasis

# Info (Blue)
blue-50:  #eff6ff  - Info backgrounds
blue-100: #dbeafe  - Info icon backgrounds
blue-500: #3b82f6  - Info indicators
blue-600: #2563eb  - Info icons

# Purple (Accents)
purple-50:  #faf5ff  - Purple backgrounds
purple-100: #f3e8ff  - Purple icon backgrounds
purple-600: #9333ea  - Purple accents

# Teal (Service/Support)
teal-50:  #f0fdfa  - Teal backgrounds
teal-100: #ccfbf1  - Teal icon backgrounds
teal-600: #0d9488  - Teal accents
```

### Gradient Patterns

```css
/* Card headers */
bg-gradient-to-r from-indigo-50 to-purple-50    /* Dashboard widgets */
bg-gradient-to-r from-purple-50 to-indigo-50    /* Feedback widgets */
bg-gradient-to-r from-teal-50 to-cyan-50        /* Service widgets */
bg-gradient-to-r from-blue-50 to-indigo-50      /* Applications widgets */
bg-gradient-to-r from-amber-50 to-orange-50     /* Alert widgets */

/* Page backgrounds */
bg-gradient-to-br from-indigo-50 via-white to-purple-50  /* Login page */

/* Chat header */
bg-gradient-to-r from-indigo-600 to-purple-600
```

---

## Typography

### Font Stack

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Font Sizes

```
text-xs:   12px / 0.75rem  - Timestamps, badges, helper text
text-sm:   14px / 0.875rem - Body text, descriptions, labels
text-base: 16px / 1rem     - Default body
text-lg:   18px / 1.125rem - Card titles, section headers
text-xl:   20px / 1.25rem  - Modal titles
text-2xl:  24px / 1.5rem   - Page titles, goal names
text-3xl:  30px / 1.875rem - Login page title
```

### Font Weights

```
font-normal:   400 - Body text
font-medium:   500 - Labels, button text, card titles
font-semibold: 600 - Section headers, emphasis
font-bold:     700 - Page titles, strong emphasis
```

### Line Heights

```
line-height: 1.5  - Default body text
leading-relaxed   - Paragraph text in summaries
```

### Text Colors

```
text-gray-900  - Primary headings
text-gray-800  - Body text (from :root)
text-gray-700  - Secondary text, labels
text-gray-600  - Table headers, metadata
text-gray-500  - Descriptions, placeholders
text-gray-400  - Timestamps, muted text
text-white     - Text on colored backgrounds
```

---

## Spacing System

### Base Spacing Scale (Tailwind)

```
0:    0px
0.5:  2px   (0.125rem)
1:    4px   (0.25rem)
1.5:  6px   (0.375rem)
2:    8px   (0.5rem)
2.5:  10px  (0.625rem)
3:    12px  (0.75rem)
4:    16px  (1rem)
5:    20px  (1.25rem)
6:    24px  (1.5rem)
8:    32px  (2rem)
10:   40px  (2.5rem)
12:   48px  (3rem)
16:   64px  (4rem)
```

### Common Spacing Patterns

```
/* Page padding */
px-4 sm:px-6 lg:px-8  - Responsive horizontal padding
py-8 / py-12          - Vertical page padding

/* Card padding */
p-4 / p-6             - Card internal padding
px-4 py-3             - Card header padding
px-3 py-2             - Compact element padding

/* Gaps */
gap-1 / gap-1.5       - Tight icon-text spacing
gap-2                 - Button content spacing
gap-3                 - Card element spacing
gap-4                 - Grid/list item spacing
gap-6                 - Section spacing

/* Margins */
mb-1 / mb-2           - Tight vertical spacing
mb-4                  - Standard vertical spacing
mb-6 / mb-8           - Section vertical spacing
mt-4 / mt-6           - Top margins
```

---

## Layout Patterns

### Container

```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Page Layout

```jsx
<div className="min-h-screen bg-gray-50">
  <Header />
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Page content */}
  </main>
</div>
```

### Grid Layouts

```jsx
/* Card grid - responsive */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

/* Dashboard widgets - two columns */
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Widgets */}
</div>

/* Feature grid - three columns */
<div className="grid grid-cols-3 gap-4">
  {/* Features */}
</div>

/* Action buttons grid */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  {/* Action buttons */}
</div>
```

### Flexbox Patterns

```jsx
/* Header/toolbar layout */
<div className="flex justify-between items-center">

/* Centered content */
<div className="flex items-center justify-center">

/* Vertical stack with gap */
<div className="flex flex-col gap-4">

/* Inline items with gap */
<div className="flex items-center gap-2">

/* Flex with overflow */
<div className="flex items-center gap-3 flex-1 min-w-0">
  <span className="truncate">{text}</span>
</div>
```

---

## Component Patterns

### Buttons

#### Primary Button

```jsx
<button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
  <Icon size={20} />
  Button Text
</button>
```

#### Primary Button (Disabled)

```jsx
<button
  disabled
  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
>
  Button Text
</button>
```

#### Secondary Button

```jsx
<button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
  Cancel
</button>
```

#### Outline Button

```jsx
<button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
  <Icon size={16} />
  Button Text
</button>
```

#### Icon Button

```jsx
<button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
  <Icon size={18} />
</button>
```

#### Icon Button (Danger)

```jsx
<button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
  <Trash2 size={18} />
</button>
```

#### Floating Action Button

```jsx
<button className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 flex items-center justify-center z-40">
  <MessageCircle size={24} />
</button>
```

### Cards

#### Basic Card

```jsx
<div className="bg-white rounded-xl border border-gray-200 p-6">
  {/* Card content */}
</div>
```

#### Clickable Card

```jsx
<div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
  {/* Card content */}
</div>
```

#### Card with Header

```jsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
      <Icon size={16} className="text-indigo-600" />
    </div>
    <div>
      <h3 className="font-medium text-gray-900 text-sm">Title</h3>
      <p className="text-xs text-gray-500">Subtitle</p>
    </div>
  </div>
  <div className="p-4">
    {/* Card body */}
  </div>
</div>
```

#### Empty State Card

```jsx
<div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <Icon className="w-8 h-8 text-indigo-600" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
  <p className="text-gray-500 mb-6 max-w-md mx-auto">Description text</p>
  <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
    Action
  </button>
</div>
```

### Forms

#### Input Field

```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    placeholder="Placeholder text"
  />
</div>
```

#### Textarea

```jsx
<textarea
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
  rows={3}
  placeholder="Placeholder text"
/>
```

#### Password Input

```jsx
<input
  type="password"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>
```

### Modals

#### Modal Container

```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
    {/* Modal header */}
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">Modal Title</h2>
      <button className="p-1 text-gray-400 hover:text-gray-600">
        <X size={20} />
      </button>
    </div>

    {/* Modal body */}
    <div className="p-4 overflow-y-auto flex-1">
      {/* Content */}
    </div>

    {/* Modal footer */}
    <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
      <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
        Cancel
      </button>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Badges

```jsx
/* Status badge */
<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
  Connected
</span>

/* Info badge */
<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
  Quick Add
</span>

/* Warning badge */
<span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full font-medium">
  New
</span>

/* Count badge */
<span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-medium">
  12 mentions
</span>
```

### Tables

```jsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="px-3 py-2 text-left font-medium text-gray-600 w-10">
          Status
        </th>
        <th className="px-3 py-2 text-left font-medium text-gray-600">
          Column
        </th>
        <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-3 py-2.5">{/* Cell content */}</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Tabs

```jsx
<div className="flex border-b border-gray-200">
  {tabs.map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
        activeTab === tab
          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {tab}
    </button>
  ))}
</div>
```

### Alerts/Banners

#### Success Alert

```jsx
<div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
  <CheckCircle className="w-5 h-5 text-green-600" />
  <span className="text-sm text-green-700">Success message</span>
</div>
```

#### Error Alert

```jsx
<div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
  <AlertCircle className="w-5 h-5 text-red-600" />
  <span className="text-sm text-red-700">Error message</span>
</div>
```

#### Warning Alert

```jsx
<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
  <strong>Note:</strong> Warning message here.
</div>
```

#### Impact Callout

```jsx
<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
  <div className="flex items-start gap-2">
    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-red-800">Title</p>
      <p className="text-xs text-red-600 mt-1">Description</p>
    </div>
  </div>
</div>
```

### Dropdown

```jsx
/* Dropdown trigger */
<div className="relative">
  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
    Content
    <ChevronDown size={16} className="text-gray-400" />
  </button>

  {/* Dropdown panel */}
  {isOpen && (
    <>
      <div className="fixed inset-0 z-10" onClick={close} />
      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-20">
        {/* Dropdown content */}
      </div>
    </>
  )}
</div>
```

### Loading States

#### Spinner

```jsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
```

#### Loading Button

```jsx
<button disabled className="flex items-center gap-2">
  <Loader2 className="w-4 h-4 animate-spin" />
  Loading...
</button>
```

#### Centered Loading

```jsx
<div className="flex items-center justify-center h-64">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
</div>
```

---

## Icon System

### Icon Library

Using **Lucide React** icons (`lucide-react`)

### Common Icon Sizes

```
size={14}  - Inline with small text
size={16}  - Buttons, table cells
size={18}  - Secondary actions
size={20}  - Primary buttons, navigation
size={24}  - Feature icons, FAB
```

### Icon Containers

```jsx
/* Small icon container */
<div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
  <Icon size={12} className="text-indigo-600" />
</div>

/* Medium icon container */
<div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
  <Icon size={16} className="text-indigo-600" />
</div>

/* Large icon container */
<div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
  <Icon size={20} className="text-indigo-600" />
</div>

/* Extra large (empty state) */
<div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
  <Icon className="w-8 h-8 text-indigo-600" />
</div>
```

### Commonly Used Icons

```jsx
import {
  // Navigation
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X,

  // Actions
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Send,
  Check,
  Play,

  // Content types
  FileText,
  FolderOpen,
  Database,
  Mail,
  MessageCircle,
  BookOpen,
  LayoutGrid,
  Calendar,

  // Status
  Loader2,
  AlertCircle,
  CheckCircle,
  Target,

  // Features
  Search,
  Settings,
  GripVertical,
  Sparkles,
} from 'lucide-react';
```

---

## Shadows & Effects

### Box Shadows

```
shadow-sm   - Subtle card shadow
shadow      - Default shadow
shadow-md   - Hover state cards
shadow-lg   - Modals, dropdowns, dragging
shadow-xl   - Login card, prominent elements
shadow-2xl  - Chat panel
```

### Border Radius

```
rounded       - 4px  - Small elements
rounded-md    - 6px  - Badges
rounded-lg    - 8px  - Buttons, inputs, cards
rounded-xl    - 12px - Cards, modals
rounded-2xl   - 16px - Chat bubbles, login card
rounded-full  - 9999px - Avatars, badges, FAB
```

### Borders

```
border border-gray-200      - Default card border
border border-gray-300      - Input borders
border-b border-gray-200    - Dividers, header borders
border-b border-gray-100    - Subtle dividers
border-t border-gray-200    - Top dividers
border-2 border-indigo-500  - Focus state (inputs)
border-dashed border-gray-300 - Add new item borders
```

### Ring (Focus States)

```
focus:ring-2 focus:ring-indigo-500  - Input focus
ring-2 ring-indigo-300              - Dragging state
```

---

## Animations

### Transitions

```
transition-colors   - Color changes (hover)
transition-all      - Multiple property changes
transition-opacity  - Fade in/out
```

### Duration

Default transition duration: 150ms (Tailwind default)

### Animation Classes

```
animate-spin   - Loading spinners (Loader2 icon)
animate-pulse  - Skeleton loading
```

### Hover Transformations

```
hover:scale-105  - Button scale on hover (FAB)
```

### Drag States

```jsx
{isDragging && 'opacity-50 shadow-lg ring-2 ring-indigo-300'}
```

---

## Responsive Design

### Breakpoints

```
sm:  640px   - Small devices
md:  768px   - Medium devices
lg:  1024px  - Large devices
xl:  1280px  - Extra large devices
2xl: 1536px  - 2X large devices
```

### Common Responsive Patterns

```jsx
/* Container padding */
px-4 sm:px-6 lg:px-8

/* Grid columns */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Show/hide elements */
hidden md:block
md:hidden

/* Text size scaling */
text-sm md:text-base

/* Width constraints */
max-w-md / max-w-lg / max-w-7xl
```

---

## Z-Index Scale

```
z-10  - Dropdown overlays
z-20  - Dropdown panels
z-40  - Floating action button
z-50  - Modals, chat panels
```

---

## Code Examples

### Complete Card Component

```jsx
function WidgetCard({ title, subtitle, icon: Icon, iconColor, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className={`px-4 py-3 border-b border-gray-100 bg-gradient-to-r ${iconColor} flex items-center gap-3`}
      >
        <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center flex-shrink-0">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
```

### Complete Button Variants

```jsx
const buttonVariants = {
  primary:
    'px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors',
  secondary:
    'px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors',
  outline:
    'px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors',
  danger:
    'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors',
  ghost:
    'p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors',
};
```

---

## Best Practices

1. **Consistency**: Always use the defined color palette and spacing scale
2. **Accessibility**: Maintain sufficient color contrast, use semantic HTML
3. **Responsive**: Design mobile-first, add breakpoint styles as needed
4. **Feedback**: Provide visual feedback for all interactive elements (hover, focus, active, disabled)
5. **Loading States**: Always show loading indicators for async operations
6. **Empty States**: Design helpful empty states that guide users to action
7. **Icons**: Use consistent icon sizes and colors throughout
8. **Whitespace**: Use generous whitespace for readability
