# WA Automation Design System - Quick Reference

## 🎨 Color Palette

### Text Colors
```jsx
className="text-slate-900"  // Primary text (#0F172A)
className="text-slate-700"  // Body text (#334155)
className="text-slate-600"  // Secondary text (#475569)
className="text-slate-500"  // Muted text (#64748B)
className="text-slate-400"  // Placeholder (#94A3B8)
```

### Background Colors
```jsx
className="bg-slate-50"     // Page background (#F8FAFC)
className="bg-white"        // Card background
className="bg-slate-100"    // Hover states (#F1F5F9)
```

### Border Colors
```jsx
className="border-slate-200"  // Default border (#E2E8F0)
className="border-slate-100"  // Subtle border (#F1F5F9)
```

### Brand Colors
```jsx
className="text-green-600"    // Primary green (#16A34A)
className="bg-green-500"      // Primary green bg (#22C55E)
className="text-red-600"      // Danger (#DC2626)
className="text-yellow-600"   // Warning (#CA8A04)
```

---

## 📝 Typography

### Headings
```jsx
<h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
  Page Title
</h1>

<h2 className="text-xl sm:text-2xl font-bold text-slate-900">
  Section Title
</h2>

<h3 className="text-lg font-bold text-slate-900">
  Subsection Title
</h3>
```

### Body Text
```jsx
<p className="text-slate-700 font-medium">
  Regular body text
</p>

<p className="text-sm text-slate-600">
  Small text
</p>

<p className="text-xs text-slate-500">
  Extra small text
</p>
```

---

## 🧩 Form Components

### Text Input
```jsx
<input
  type="text"
  className="input-modern w-full"
  placeholder="Enter text..."
/>
```

### Select Dropdown
```jsx
<select className="select-modern w-full">
  <option>Choose option...</option>
  <option value="1">Option 1</option>
</select>
```

### Textarea
```jsx
<textarea
  className="textarea-modern w-full"
  placeholder="Enter description..."
  rows={4}
/>
```

### Label
```jsx
<label className="label-modern">
  Field Name <span className="text-red-500">*</span>
</label>
```

---

## 🔘 Buttons

### Primary Button
```jsx
<button className="btn-primary">
  Save Changes
</button>

<button className="btn-primary mobile-full">
  Full Width on Mobile
</button>
```

### Secondary Button
```jsx
<button className="btn-secondary">
  Cancel
</button>
```

### Ghost Button
```jsx
<button className="btn-ghost">
  Learn More
</button>
```

### Icon Button
```jsx
<button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200">
  <Icon className="w-5 h-5 text-slate-600" />
</button>
```

---

## 📦 Cards

### Basic Card
```jsx
<div className="card-modern p-6">
  <h3 className="font-bold text-slate-900 mb-4">Card Title</h3>
  <p className="text-slate-600">Card content...</p>
</div>
```

### Stat Card
```jsx
<div className="stat-card">
  <div className="flex items-center justify-between mb-4">
    <div className="stat-icon bg-blue-50">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <TrendingUp className="w-5 h-5 text-green-500" />
  </div>
  <h3 className="stat-value">1,234</h3>
  <p className="stat-label">Total Users</p>
</div>
```

---

## 🏷️ Badges

### Status Badges
```jsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Inactive</span>
<span className="badge badge-info">New</span>
```

### Custom Badge
```jsx
<span className="badge bg-purple-100 text-purple-700">
  Custom
</span>
```

---

## 📊 Tables

### Modern Table
```jsx
<div className="card-modern overflow-hidden">
  <div className="overflow-x-auto">
    <table className="table-modern">
      <thead>
        <tr>
          <th>Name</th>
          <th className="hidden sm:table-cell">Email</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John Doe</td>
          <td className="hidden sm:table-cell">john@example.com</td>
          <td><span className="badge badge-success">Active</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 📱 Responsive Utilities

### Mobile Stack
```jsx
<div className="mobile-stack">
  <div className="flex-1">Left content</div>
  <div className="flex-1">Right content</div>
</div>
```

### Mobile Grid
```jsx
<div className="mobile-grid">
  <div className="stat-card">Card 1</div>
  <div className="stat-card">Card 2</div>
  <div className="stat-card">Card 3</div>
  <div className="stat-card">Card 4</div>
</div>
```

### Mobile Full Width
```jsx
<button className="btn-primary mobile-full">
  Button
</button>
```

### Responsive Visibility
```jsx
<div className="hidden sm:block">Visible on tablet+</div>
<div className="sm:hidden">Visible on mobile only</div>
<div className="hidden lg:block">Visible on desktop+</div>
```

---

## 🎭 Loading States

### Skeleton Loader
```jsx
<div className="card-modern p-6 animate-pulse">
  <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
</div>
```

### Loading Spinner
```jsx
<div className="flex items-center justify-center h-64">
  <div className="text-slate-500 font-medium">Loading...</div>
</div>
```

---

## 🎨 Empty States

### Standard Empty State
```jsx
<div className="card-modern p-8 sm:p-12 text-center">
  <Icon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-300" />
  <p className="text-slate-600 font-semibold text-lg mb-2">
    No items found
  </p>
  <p className="text-sm text-slate-500">
    Items will appear here when available
  </p>
</div>
```

---

## 🔍 Search & Filters

### Search Input
```jsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input
    type="text"
    placeholder="Search..."
    className="input-modern w-full pl-11"
  />
</div>
```

### Filter Dropdown
```jsx
<div className="flex items-center gap-2">
  <Filter className="w-5 h-5 text-slate-400" />
  <select className="select-modern">
    <option value="all">All Items</option>
    <option value="active">Active</option>
  </select>
</div>
```

---

## 🎯 Icons

### Icon Sizes
```jsx
<Icon className="w-4 h-4" />   // Small (16px)
<Icon className="w-5 h-5" />   // Medium (20px)
<Icon className="w-6 h-6" />   // Large (24px)
<Icon className="w-8 h-8" />   // XL (32px)
<Icon className="w-12 h-12" /> // 2XL (48px)
```

### Icon Colors
```jsx
<Icon className="w-5 h-5 text-slate-600" />
<Icon className="w-5 h-5 text-green-600" />
<Icon className="w-5 h-5 text-red-600" />
```

---

## 🎬 Animations

### Hover Effects
```jsx
className="transition-all duration-200 hover:bg-slate-100"
className="transition-colors hover:text-green-600"
className="transition-transform hover:-translate-y-0.5"
```

### Focus States
```jsx
className="focus:outline-none focus:ring-4 focus:ring-green-500/15 focus:border-green-500"
```

---

## 📐 Spacing

### Padding
```jsx
className="p-4 sm:p-6 lg:p-8"     // Responsive padding
className="px-6 py-4"              // Horizontal & vertical
className="p-6"                    // All sides (24px)
```

### Margin
```jsx
className="mb-6 sm:mb-8"          // Responsive margin bottom
className="gap-4 sm:gap-6"        // Responsive gap
```

### Rounded Corners
```jsx
className="rounded-xl"            // 12px (inputs, buttons)
className="rounded-2xl"           // 16px (cards)
className="rounded-full"          // Fully rounded (badges)
```

---

## 🎨 Shadows

### Card Shadow
```css
box-shadow: 0 10px 25px rgba(0,0,0,0.06)
```

### Hover Shadow
```css
box-shadow: 0 20px 40px rgba(0,0,0,0.08)
```

---

## 📱 Breakpoints

```jsx
// Mobile first approach
className="text-sm sm:text-base lg:text-lg"

// Breakpoint values:
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

---

## ✅ Best Practices

1. **Always use semantic HTML**
2. **Mobile-first responsive design**
3. **High contrast for accessibility**
4. **Consistent spacing (4px grid)**
5. **Smooth transitions (200ms)**
6. **Loading states for async operations**
7. **Empty states with helpful messages**
8. **Error states with recovery actions**
9. **Focus states for keyboard navigation**
10. **Touch-friendly tap targets (44px min)**

---

## 🚀 Quick Start Template

```jsx
import { Icon } from 'lucide-react';

const MyComponent = () => {
  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Page Title
        </h1>
        <button className="btn-primary mobile-full">
          <Icon className="w-5 h-5" />
          Action
        </button>
      </div>

      {/* Content Card */}
      <div className="card-modern p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Section Title
        </h2>
        <p className="text-slate-600">
          Content goes here...
        </p>
      </div>
    </div>
  );
};

export default MyComponent;
```

---

**Design System Version**: 2.0.0
**Last Updated**: 2024
**Status**: Production Ready ✅
