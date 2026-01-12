The footer component of the modern art e-commerce website built with React is not displaying correctly on mobile devices. When the viewport is reduced to mobile sizes, the footer content becomes misaligned and visually unbalanced, negatively impacting usability and aesthetic consistency.

Specifically, all footer sections (brand description, navigation links, and contact information) shift excessively toward the left edge of the screen instead of remaining visually centered. Additionally, the social media icons are positioned directly after the brand description within the first column, which disrupts the expected content flow on mobile layouts.

These issues must be resolved while preserving the existing desktop grid layout, Tailwind CSS utility classes, hover effects, transitions, and semantic HTML structure. The solution should follow a mobile-first responsive approach, ensure proper spacing and alignment on smaller screens, and maintain full responsiveness of the footer’s bottom bar (copyright and legal links).




Center all footer content on mobile viewports.

Apply a 20% margin on both left and right sides for balanced spacing on mobile.

Keep all footer sections (brand, links, contact info) visually centered within the available space.

Reposition the social media icons to appear below all footer sections (Explore, Support, Visit Us) on mobile view.

Preserve the original placement of social media icons for tablet and desktop viewports.

Maintain all existing Tailwind CSS utility classes and styling.

Preserve all hover effects, transitions, colors, and typography.

Keep the existing desktop grid layout intact (md:grid-cols-2, lg:grid-cols-4).

Ensure the footer bottom bar (copyright and legal links) remains responsive and properly aligned.

Use a mobile-first responsive approach.

Do not alter the semantic HTML structure.