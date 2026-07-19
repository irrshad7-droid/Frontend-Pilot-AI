import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: ReactNode;
  showBack?: boolean;
}

export function AppShell({ children, showBack }: AppShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId = 0;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        if (shellRef.current) {
          const rect = shellRef.current.getBoundingClientRect();
          const x = lastX - rect.left;
          const y = lastY - rect.top;
          shellRef.current.style.setProperty("--mouse-x", `${x}px`);
          shellRef.current.style.setProperty("--mouse-y", `${y}px`);
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="app-shell"
      style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}
    >
      <div className="noise-overlay" />
      <div className="volumetric-light-1" />
      <div className="volumetric-light-2" />
      <div className="depth-grid" />

      {/* Drifting particle field */}
      <div
        className="dust-particle"
        style={{
          top: "22%",
          left: "12%",
          animation: "drift-particle 18s linear infinite",
          animationDelay: "0s",
        }}
      />
      <div
        className="dust-particle"
        style={{
          top: "62%",
          left: "32%",
          animation: "drift-particle 24s linear infinite",
          animationDelay: "3s",
        }}
      />
      <div
        className="dust-particle"
        style={{
          top: "14%",
          left: "72%",
          animation: "drift-particle 20s linear infinite",
          animationDelay: "6s",
        }}
      />
      <div
        className="dust-particle"
        style={{
          top: "78%",
          left: "68%",
          animation: "drift-particle 22s linear infinite",
          animationDelay: "1s",
        }}
      />
      <div
        className="dust-particle"
        style={{
          top: "42%",
          left: "82%",
          animation: "drift-particle 26s linear infinite",
          animationDelay: "8s",
        }}
      />

      <TopBar showBack={showBack} />
      {children}
    </div>
  );
}
