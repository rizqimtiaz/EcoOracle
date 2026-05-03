"use client";

import { useEffect, useRef } from "react";

/**
 * HeroGlobe — a small, dependency-free animated 3D-feeling wireframe globe
 * with rotating "carbon parcel" markers. Pure SVG + requestAnimationFrame.
 */
export function HeroGlobe() {
  const ref = useRef<SVGSVGElement>(null);
  const rotRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      rotRef.current = (rotRef.current + 0.002) % (Math.PI * 2);
      const svg = ref.current;
      if (svg) {
        const g = svg.querySelector<SVGGElement>("[data-rot]");
        if (g) g.setAttribute("transform", `rotate(${(rotRef.current * 180) / Math.PI}, 200, 200)`);
        const markers = svg.querySelectorAll<SVGCircleElement>("[data-marker]");
        markers.forEach((m) => {
          const lat = parseFloat(m.dataset.lat ?? "0");
          const lng = parseFloat(m.dataset.lng ?? "0");
          const adjusted = lng + (rotRef.current * 180) / Math.PI;
          const pos = project(lat, adjusted);
          m.setAttribute("cx", String(pos.x));
          m.setAttribute("cy", String(pos.y));
          m.setAttribute("opacity", String(pos.visible ? pos.depth : 0));
          m.setAttribute("r", String(2 + pos.depth * 2.5));
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[480px]">
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-eco-500/15 via-transparent to-transparent blur-2xl" />
      <svg
        ref={ref}
        viewBox="0 0 400 400"
        className="relative h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="globeFill" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#0e161e" />
            <stop offset="60%" stopColor="#05090c" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <linearGradient id="globeStroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#67ffb1" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0073db" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="200" r="170" fill="url(#globeFill)" />
        <circle
          cx="200"
          cy="200"
          r="170"
          fill="none"
          stroke="url(#globeStroke)"
          strokeWidth="0.8"
        />

        <g data-rot transform="rotate(0,200,200)">
          {[-60, -30, 0, 30, 60].map((lat) => (
            <ellipse
              key={`lat-${lat}`}
              cx="200"
              cy="200"
              rx="170"
              ry={170 * Math.cos((lat * Math.PI) / 180)}
              fill="none"
              stroke="rgba(46,241,145,0.12)"
              strokeWidth="0.5"
              transform={`translate(0, ${lat * 1.2}) `}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse
              key={`lng-${i}`}
              cx="200"
              cy="200"
              rx={170 * Math.abs(Math.cos((i / 12) * Math.PI))}
              ry="170"
              fill="none"
              stroke="rgba(46,241,145,0.1)"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Equator highlight */}
        <ellipse
          cx="200"
          cy="200"
          rx="170"
          ry="35"
          fill="none"
          stroke="rgba(46,241,145,0.25)"
          strokeWidth="0.6"
        />

        {/* Carbon parcel markers — positions roughly tracking the seeded data */}
        {MARKERS.map((m, i) => (
          <g key={i}>
            <circle
              data-marker
              data-lat={m.lat}
              data-lng={m.lng}
              cx="0"
              cy="0"
              r="3"
              fill={m.color}
              opacity="0.9"
            >
              <animate
                attributeName="r"
                values="2;5;2"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}

        <circle cx="200" cy="200" r="170" fill="none" stroke="#1b2a36" strokeWidth="1.4" />
      </svg>

      {/* Scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute inset-x-0 h-12 -translate-y-full animate-scan bg-gradient-to-b from-transparent via-eco-400/30 to-transparent" />
      </div>
    </div>
  );
}

function project(lat: number, lng: number): { x: number; y: number; visible: boolean; depth: number } {
  const phi = (lat * Math.PI) / 180;
  const theta = (lng * Math.PI) / 180;
  const x = Math.cos(phi) * Math.sin(theta);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(theta);
  const visible = z > -0.05;
  return {
    x: 200 + x * 168,
    y: 200 - y * 168,
    visible,
    depth: Math.max(0.1, z + 0.3),
  };
}

const MARKERS = [
  { lat: -3.81, lng: -55.5, color: "#67ffb1" },
  { lat: -2.32, lng: 113.79, color: "#ffb454" },
  { lat: -2.0, lng: 21.5, color: "#67ffb1" },
  { lat: 21.95, lng: 88.9, color: "#67ffb1" },
  { lat: 57.05, lng: -134.4, color: "#67ffb1" },
  { lat: -19.28, lng: 22.8, color: "#67ffb1" },
  { lat: -10.1, lng: -48.3, color: "#3eb3ff" },
  { lat: 63.45, lng: 14.65, color: "#67ffb1" },
  { lat: -8.6, lng: -38.3, color: "#ffb454" },
  { lat: -45.4, lng: 167.0, color: "#67ffb1" },
  { lat: -3.9, lng: 114.7, color: "#ff6c6c" },
  { lat: 6.7, lng: 38.5, color: "#67ffb1" },
  { lat: 16.7, lng: -92.7, color: "#67ffb1" },
  { lat: 52.4, lng: -127.0, color: "#67ffb1" },
];
