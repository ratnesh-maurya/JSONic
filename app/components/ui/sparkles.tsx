"use client";
import { useEffect, useRef } from "react";

export const SparklesCore = ({
    background,
    minSize = 1,
    maxSize = 2,
    particleDensity = 50,
    particleColor = "#6366f1",
    className,
    id,
}: {
    background?: string;
    minSize?: number;
    maxSize?: number;
    particleDensity?: number;
    particleColor?: string;
    className?: string;
    id?: string;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }>>([]);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Create particles
        const particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }> = [];

        for (let i = 0; i < particleDensity; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * (maxSize - minSize) + minSize,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.5,
            });
        }

        particlesRef.current = particles;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `${particleColor}${Math.floor(particle.opacity * 255).toString(16).padStart(2, "0")}`;
                ctx.fill();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [particleDensity, minSize, maxSize, particleColor]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            id={id}
            style={{
                background: background || "transparent",
            }}
        />
    );
};
