import React, { useCallback, useEffect, useRef } from 'react';

const DustInput = () => {
  // Refs for the input element and the canvas
  const inputRef = useRef<HTMLInputElement>(null); // Tracks the input field
  const canvasRef = useRef<HTMLCanvasElement>(null); // Tracks the canvas element
  const particlesRef = useRef<Particle[]>([]); // Mutable ref to hold particles (avoids excessive state updates)

  // Particle interface to define particle properties
  interface Particle {
    x: number; // X-coordinate
    y: number; // Y-coordinate
    vx: number; // X-velocity
    vy: number; // Y-velocity
    alpha: number; // Opacity
    size: number; // Size of the particle
    lifespan: number; // Lifespan (used to calculate fade-out)
    color: string; // Color of the particle
  }

  // Particle settings to control behavior and appearance
  const particleSettings = {
    size: 1.25, // Initial size of particles
    speed: 5, // Speed of particles
    wind: 1, // Horizontal motion (wind effect)
    animationOffsetLeft: 25, // Offset from left
    numberOfParticles: 120, // Number of particles
    lifespan: 120, // Increased lifespan (was 120)
    fadeSpeed: 2, // New property to control fade speed
    colors: ['#000000', '#969696', '#333333', '#404040', '#2e2e2e', '#dbdbdb'], // Array of possible particle colors
  };

  // Function to create particles at a specific position
  const createParticles = (x: number, y: number, count: number) => {
    // Generate `count` particles with random properties
    const newParticles = Array.from({ length: count }, () => ({
      x: x + (Math.random() - 0.5) * 25, // Randomize initial position
      y: y + (Math.random() - 0.5) * 5,
      vx: Math.random() * particleSettings.speed + particleSettings.wind, // Add horizontal motion
      vy: (Math.random() - 0.5) * particleSettings.speed, // Random vertical motion
      alpha: 1, // Full opacity at start
      size: particleSettings.size, // Set initial size
      lifespan: particleSettings.lifespan, // Lifespan in frames
      color:
        particleSettings.colors[
          Math.floor(Math.random() * particleSettings.colors.length)
        ], // Random color
    }));
    particlesRef.current.push(...newParticles); // Add new particles to the particle list
  };

  // Animation function
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (particlesRef.current.length > 0) {
      particlesRef.current = particlesRef.current
        .map((p) => {
          p.x += p.vx;
          p.y += p.vy + (Math.random() - 0.5) * 0.5;
          p.alpha -= particleSettings.fadeSpeed / p.lifespan;
          p.size *= 0.99;
          return p.alpha > 0 ? p : null;
        })
        .filter((p): p is Particle => p !== null);

      particlesRef.current.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(animate);
  }, []);

  // Effect to handle the animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions to cover the full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Start animation immediately
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [animate]);

  // Memoize the input handler
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const currentValue = (e.target as HTMLInputElement).value;
    const previousValue = inputRef.current?.dataset.previousValue || '';
    const fontStyle = getComputedStyle(e.target as HTMLInputElement).font;

    if (currentValue.length < previousValue.length) {
      const deletedCharIndex = previousValue.length - 1;
      const charToDelete = previousValue[deletedCharIndex];

      if (charToDelete !== ' ') {
        const textWidth = getTextWidth(
          previousValue.slice(0, deletedCharIndex),
          fontStyle
        );
        const inputElement = e.target as HTMLInputElement;
        const inputRect = inputElement.getBoundingClientRect();

        const x = inputRect.left + textWidth;
        const y = inputRect.top + inputRect.height / 2;

        createParticles(x, y, particleSettings.numberOfParticles);
      }
    }

    if (inputRef.current) {
      inputRef.current.dataset.previousValue = currentValue;
    }
  }, []);

  // Helper function to calculate the width of a text string in a given font
  const getTextWidth = (text: string, font: string): number => {
    const canvas = document.createElement('canvas'); // Create a temporary canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font; // Set the font

      // Measure text width
      const textWidth =
        context.measureText(text).width + particleSettings.animationOffsetLeft;
      const inputFieldWidth =
        inputRef.current?.getBoundingClientRect().width ?? 0;

      const width = textWidth <= inputFieldWidth ? textWidth : inputFieldWidth;

      return width;
    }
    return 0; // Default to 0 if context is unavailable
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      {/* Canvas for rendering particles */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none w-full h-full"
      ></canvas>
      <div className="relative">
        {/* Input field for user interaction */}
        <input
          ref={inputRef}
          onInput={handleInput}
          data-previous-value=""
          type="text"
          placeholder="Type and delete..."
          className="text-xl px-4 py-2 ring-3 ring-gray-200 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all duration-700 ease-in-out w-[300px]"
        />
      </div>
    </div>
  );
};

export default DustInput;
