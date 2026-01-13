## Problem Statement

When the viewport is reduced to mobile sizes:

* All footer content (brand description, navigation links, and contact information) **shifts excessively to the left**, instead of remaining visually centered.  
* **Social media icons** are positioned immediately after the brand description within the first column, disrupting the expected content flow on mobile layouts.  
* Desktop layout must remain intact, preserving **grid structure, Tailwind CSS styling, hover effects, transitions, and semantic HTML**.  

The solution must:

* Implement a **mobile-first responsive design**.  
* Ensure proper **spacing and alignment** on smaller screens.  
* Maintain full responsiveness of the **footer’s bottom bar** (copyright and legal links).  


## Issues to Fix

1. **Mobile Content Alignment Problem**  
   * Center footer content on mobile viewports.  
   * Apply approximately **20% margin** on the left and right to create visual breathing room while keeping content centered.  

2. **Social Media Icons Placement**  
   * Move the social media icons container to appear **below all other content sections** (Explore, Support, Visit Us) in mobile view.  


## Requirements

* Maintain all existing **Tailwind CSS utility classes and styling**.  
* Preserve **hover effects, transitions, and color schemes**.  
* Keep existing **grid structure** for desktop views (`md:grid-cols-2`, `lg:grid-cols-4`).  
* Ensure the **bottom bar** (copyright and legal links) remains responsive and properly aligned.  
* Follow a **mobile-first responsive approach**.  
* Do **not alter semantic HTML** or remove any existing content.  


## Tech Stack

* **React** (functional components)  
* **Tailwind CSS** (utility-first styling)  
* **Responsive design principles** (mobile-first approach)  
* **CSS Grid & Flexbox** for layout management  
* **Modern JavaScript / TypeScript**  