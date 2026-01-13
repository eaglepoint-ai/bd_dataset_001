## Problem Statement

Determining if a user is on a mobile device can be challenging:

* Current approaches are often **not reactive**.  
* They **fail to update** on window resize.  
* They may cause **hydration mismatches** during server-side rendering (SSR).  

`useIsMobile` provides a **consistent, efficient, and safe solution** by:

* Using a **768px breakpoint** to define mobile devices.  
* Reacting to **window resizing** to keep state up-to-date.  
* Being **SSR-safe** by initializing state as `undefined` to prevent hydration errors.  
* Cleaning up **event listeners** on component unmount.  
* Returning a **boolean** indicating if the user is on a mobile device.  

---

## Features / Requirements

* Detect if the user is on a **mobile device** using screen width.  
* **768px** breakpoint for mobile.  
* **Reactive**: updates automatically when the browser is resized.  
* **SSR-safe**: avoids hydration mismatches by initializing state as `undefined`.  
* Cleans up **resize event listeners** on unmount.  
* Returns a **boolean** value.  
* Built as a **reusable React hook** (`useIsMobile`).  

---

## Tech Stack

* **React** (functional components & hooks)  
* **TypeScript** (type safety and clarity)  
* **Browser APIs** (`window.innerWidth`, `resize` event)  
* **SSR-safe** for frameworks like **Next.js**  

