import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../repository_after/useIsMobile";

describe("useIsMobile hook", () => {
  const resizeWindow = (width: number) => {
    (window as any).innerWidth = width;
    window.dispatchEvent(new Event("resize"));
  };

  it("should return undefined on initial render (SSR-safe)", () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBeUndefined();
  });

  it("should return true when viewport width is less than 768px", async () => {
    resizeWindow(500);

    const { result } = renderHook(() => useIsMobile());
    await act(async () => {});

    expect(result.current).toBe(true);
  });

  it("should return false when viewport width is 768px or more", async () => {
    resizeWindow(1024);

    const { result } = renderHook(() => useIsMobile());

    await act(async () => {});

    expect(result.current).toBe(false);
  });

  it("should update value on window resize", async () => {
    resizeWindow(1024);

    const { result } = renderHook(() => useIsMobile());
    await act(async () => {});

    expect(result.current).toBe(false);

    act(() => {
      resizeWindow(500);
    });

    expect(result.current).toBe(true);
  });
});
