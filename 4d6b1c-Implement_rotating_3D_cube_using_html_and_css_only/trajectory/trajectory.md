# Trajectory (Thinking Process for Cube Implementation)

1.  **Requirement Audit**: I analyzed the goal of creating a 3D rotating cube using only HTML and CSS. I identified the need for a "glassmorphism" aesthetic, semantic structure, and responsive behavior.

2.  **Scene Foundation**: I established the 3D environment by applying `perspective` to the parent container. This is crucial for defining how far the viewer is from the Z-plane, giving the elements depth.

3.  **Coordinate System**: I used `transform-style: preserve-3d` on the cube container. This ensures that child elements (faces) maintain their position in 3D space relative to the container rather than being flattened.

4.  **Design System**: I defined CSS variables in `:root` for the cube size, colors, and animation duration. This centralizes configuration and makes the glassmorphic styling (opacity, blur) easy to tune.

5.  **Face Geometry**: I implemented the 6 cube faces. Each face is positioned by rotating it on its respective axis (X or Y) and then translates it along the Z-axis by half the cube's size.

6.  **Glassmorphism Effect**: I applied `backdrop-filter: blur(8px)` and a translucent background to create the frosted glass look. I added inset box-shadows to give the faces a subtle internal glow.

7.  **Animation Logic**: I created the `@keyframes rotateCube` that rotates the container 360 degrees on all three axes (X, Y, Z). This creates a dynamic, multi-dimensional movement.

8.  **Interaction Design**: I added a hover state to the scene that pauses the animation using `animation-play-state: paused`, providing better control and accessibility for the user.

9.  **Responsive Scaling**: I implemented a media query for smaller screens. By simply updating the `--cube-size` variable, the entire geometry scales down proportionally.

10. **Semantic Polish**: I wrapped the scene in a `<main>` tag for structure and added ARIA roles/labels to ensure that the visual-only element is correctly identified by screen readers.
