"use client";

import React, { useEffect, useRef } from "react";
import { useGame } from "@/lib/GameContext";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

export default function RocketCanvas() {
  const { round, currentMultiplierBps, countdown } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const shakeRef = useRef<number>(0);
  const prevStatusRef = useRef<string>(round?.status ?? "Waiting");

  const isLive = round?.status === "Live";
  const isCrashed = round?.status === "Settled" || round?.status === "Resolving";
  const isWaiting = round?.status === "Waiting";
  const crashMultiplier = ((round?.crashPointBps ?? 0) / 100).toFixed(2);
  const currentMultiplier = (currentMultiplierBps / 100).toFixed(2);

  // Initialize ambient stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        speed: 0.5 + Math.random() * 2,
        size: 1 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
      });
    }
    starsRef.current = stars;
  }, []);

  // Trigger explosion on crash
  useEffect(() => {
    if (round?.status === "Settled" && prevStatusRef.current !== "Settled") {
      shakeRef.current = 15; // screen shake
      const canvas = canvasRef.current;
      if (canvas) {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);

        // Spawn 80 explosion particles
        const explosion: Particle[] = [];
        const colors = ["#ff0055", "#ff5500", "#ffaa00", "#ffffff", "#8b5cf6"];
        for (let i = 0; i < 85; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 9;
          explosion.push({
            x: w * 0.75,
            y: h * 0.35,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            life: 0,
            maxLife: 40 + Math.random() * 30,
          });
        }
        particlesRef.current = explosion;
      }
    }
    prevStatusRef.current = round?.status ?? "Waiting";
  }, [round?.status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Apply screen shake if active
      ctx.save();
      if (shakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * shakeRef.current;
        const dy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(dx, dy);
        shakeRef.current *= 0.88;
        if (shakeRef.current < 0.3) shakeRef.current = 0;
      }

      // 1. Draw glowing cyberpunk grid
      ctx.strokeStyle = "rgba(139, 92, 246, 0.07)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw moving starfield
      ctx.fillStyle = "#ffffff";
      starsRef.current.forEach((star) => {
        const speedMultiplier = isLive ? 3 : 0.6;
        star.x -= star.speed * speedMultiplier;
        star.y += (star.speed * speedMultiplier) / 2;
        if (star.x < 0) star.x = width + 20;
        if (star.y > height) star.y = -10;

        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 3. Compute flight path based on multiplier
      // Multiplier starts at 1.00 (bps = 10_000)
      const progress = Math.min((currentMultiplierBps - 10_000) / 25_000, 1);
      const startX = width * 0.08;
      const startY = height * 0.88;
      const targetX = startX + (width * 0.72) * Math.min(progress * 1.3, 1);
      const targetY = startY - (height * 0.68) * Math.min(progress, 1);

      if (isLive || isCrashed) {
        // Draw flight curve
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const cpX = (startX + targetX) / 2;
        const cpY = startY;
        ctx.quadraticCurveTo(cpX, cpY, targetX, targetY);

        // Gradient under curve
        const gradient = ctx.createLinearGradient(0, targetY, 0, startY);
        if (isCrashed) {
          gradient.addColorStop(0, "rgba(239, 68, 68, 0.35)");
          gradient.addColorStop(1, "rgba(239, 68, 68, 0.0)");
          ctx.strokeStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
        } else {
          gradient.addColorStop(0, "rgba(0, 255, 163, 0.3)");
          gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.15)");
          gradient.addColorStop(1, "rgba(0, 255, 163, 0.0)");
          ctx.strokeStyle = "#00ffa3";
          ctx.shadowColor = "#00ffa3";
        }

        ctx.shadowBlur = 12;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Fill area under curve
        ctx.lineTo(targetX, startY);
        ctx.lineTo(startX, startY);
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 0;
        ctx.fill();

        // 4. Draw Rocket if NOT crashed
        if (isLive) {
          // Emit rocket thruster particles
          if (Math.random() < 0.7) {
            particlesRef.current.push({
              x: targetX - 10,
              y: targetY + 6,
              vx: -1.5 - Math.random() * 3,
              vy: 1 + Math.random() * 2,
              size: 2 + Math.random() * 3,
              color: Math.random() > 0.5 ? "#00ffa3" : "#00f0ff",
              alpha: 0.9,
              life: 0,
              maxLife: 20 + Math.random() * 15,
            });
          }

          // Draw rocket ship
          ctx.save();
          ctx.translate(targetX, targetY);
          const angle = Math.atan2(targetY - cpY, targetX - cpX) + 0.2;
          ctx.rotate(angle);

          // Rocket Body
          ctx.shadowColor = "#00ffa3";
          ctx.shadowBlur = 15;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-12, -9);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-12, 9);
          ctx.closePath();
          ctx.fill();

          // Cockpit Neon Glass
          ctx.fillStyle = "#00f0ff";
          ctx.beginPath();
          ctx.arc(2, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Thruster flame
          const flameSize = 10 + Math.sin(Date.now() / 30) * 4;
          ctx.fillStyle = "#ff5500";
          ctx.shadowColor = "#ff5500";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(-10, -4);
          ctx.lineTo(-10 - flameSize, 0);
          ctx.lineTo(-10, 4);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }

      // 5. Update & draw particles (thruster smoke & crash explosions)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentMultiplierBps, isLive, isCrashed]);

  return (
    <div className="rocket-arena">
      <canvas ref={canvasRef} className="rocket-canvas" />

      {/* Floating Center Multiplier Overlay */}
      <div className="arena-hud">
        {isWaiting && (
          <div className="waiting-pill">
            <div className="countdown-ring">
              <span className="countdown-number">{countdown}</span>
            </div>
            <div className="waiting-info">
              <span className="waiting-label">NEXT ROUND IN</span>
              <span className="waiting-sub">Deposit SOL to participate</span>
            </div>
          </div>
        )}

        {isLive && (
          <div className="live-pill">
            <div className="multiplier-hero-value">
              {currentMultiplier}
              <span className="multiplier-x">×</span>
            </div>
            <div className="er-pulse-badge">
              <span className="pulse-circle" />
              10ms Ephemeral Rollup Live
            </div>
          </div>
        )}

        {isCrashed && (
          <div className="crashed-pill">
            <div className="crashed-hero-value">
              💥 {crashMultiplier}
              <span className="multiplier-x">×</span>
            </div>
            <div className="crashed-sub">RUGGED BY VRF</div>
          </div>
        )}
      </div>

      {/* Corner telemetry watermark */}
      <div className="arena-watermark">
        <span>ER SLOT FREQUENCY: 100Hz (~10ms)</span>
        <span>MAGICBLOCK VERIFIABLE RANDOMNESS</span>
      </div>
    </div>
  );
}
