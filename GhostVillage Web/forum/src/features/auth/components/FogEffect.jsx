import { useEffect, useRef } from 'react';
import './FogEffect.css';

const FogEffect = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999, vx: 0, vy: 0 });
  const lastMouseRef = useRef({ x: -9999, y: -9999 });
  const puffCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    // Config
    const CONFIG = {
      particleCount: 350,
      puffSize: 300,
      baseVelocity: 0.08,
      mouseForce: 0.15,
      drag: 0.96,
      returnSpeed: 0.005,
      interactionRadius: 100
    };

    // Tạo puff texture
    const puffCanvas = document.createElement('canvas');
    puffCanvas.width = CONFIG.puffSize;
    puffCanvas.height = CONFIG.puffSize;
    const puffCtx = puffCanvas.getContext('2d');

    const grd = puffCtx.createRadialGradient(
      CONFIG.puffSize / 2, CONFIG.puffSize / 2, 0,
      CONFIG.puffSize / 2, CONFIG.puffSize / 2, CONFIG.puffSize / 2
    );
    grd.addColorStop(0, 'rgba(200, 210, 220, 0.15)');
    grd.addColorStop(0.4, 'rgba(150, 160, 170, 0.08)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');

    puffCtx.fillStyle = grd;
    puffCtx.fillRect(0, 0, CONFIG.puffSize, CONFIG.puffSize);
    puffCanvasRef.current = puffCanvas;

    // Particle class
    class Particle {
      constructor() {
        this.initSpawn();
      }

      initSpawn() {
        // Initial spawn - sương sẵn dầy đặc
        const randomX = Math.random() * canvas.width;
        const randomY = Math.random() * canvas.height;
        
        this.x = randomX;
        this.y = randomY;
        this.originX = this.x;
        this.originY = this.y;
        this.vx = (Math.random() - 0.5) * CONFIG.baseVelocity * 0.5;
        this.vy = -(Math.random() * CONFIG.baseVelocity * 0.5 + 0.02);
        this.size = CONFIG.puffSize * (0.8 + Math.random() * 0.4);
        this.alpha = 0;
        this.maxAlpha = 0.5 + Math.random() * 0.5;
        this.life = Math.floor(Math.random() * 80) + 20;
        this.angle = Math.random() * Math.PI * 2;
        this.va = (Math.random() - 0.5) * 0.0005;
      }

      reset() {
        // Reset khi bay ra khỏi màn hình - từ từ xuất hiện từ cạnh
        const side = Math.random();
        
        if (side < 0.33) {
          // From bottom
          this.x = Math.random() * canvas.width;
          this.y = canvas.height + CONFIG.puffSize;
        } else if (side < 0.66) {
          // From left
          this.x = -CONFIG.puffSize;
          this.y = Math.random() * canvas.height;
        } else {
          // From right
          this.x = canvas.width + CONFIG.puffSize;
          this.y = Math.random() * canvas.height;
        }
        
        this.originX = this.x;
        this.originY = this.y;
        this.vx = (Math.random() - 0.5) * CONFIG.baseVelocity;
        this.vy = -(Math.random() * CONFIG.baseVelocity + 0.1);
        this.size = CONFIG.puffSize * (0.8 + Math.random() * 0.4);
        this.alpha = 0;
        this.maxAlpha = 0.5 + Math.random() * 0.5;
        this.life = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.va = (Math.random() - 0.5) * 0.0005;
      }

      update(mouseX, mouseY, mouseVx, mouseVy) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.interactionRadius) {
          const force = (CONFIG.interactionRadius - dist) / CONFIG.interactionRadius;
          this.vx += (dx / dist) * force * CONFIG.mouseForce * 5;
          this.vy += (dy / dist) * force * CONFIG.mouseForce * 5;
          this.vx += mouseVx * force * CONFIG.mouseForce;
          this.vy += mouseVy * force * CONFIG.mouseForce;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.va;

        this.vx *= CONFIG.drag;
        this.vy *= CONFIG.drag;

        this.x += Math.sin(Date.now() * 0.0002 + this.y * 0.01) * 0.02;
        this.y -= 0.05;

        this.life++;

        if (this.life < 60) {
          this.alpha += 0.025;
          if (this.alpha > this.maxAlpha) this.alpha = this.maxAlpha;
        }

        if (this.y < -this.size || this.x < -this.size || this.x > canvas.width + this.size) {
          this.reset();
        }
      }

      draw() {
        if (this.alpha <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(puffCanvas, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    particlesRef.current = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particlesRef.current.push(new Particle());
    }

    // Mouse handler
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      if (lastMouseRef.current.x !== -9999) {
        mouseRef.current.vx = e.clientX - lastMouseRef.current.x;
        mouseRef.current.vy = e.clientY - lastMouseRef.current.y;
      }

      lastMouseRef.current.x = e.clientX;
      lastMouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Velocity decay
    const velocityInterval = setInterval(() => {
      mouseRef.current.vx *= 0.1;
      mouseRef.current.vy *= 0.1;
    }, 50);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'screen';

      particlesRef.current.forEach((p) => {
        p.update(mouseRef.current.x, mouseRef.current.y, mouseRef.current.vx, mouseRef.current.vy);
        p.draw();
      });

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(velocityInterval);
    };
  }, []);

  return <canvas ref={canvasRef} className="fog-canvas" />;
};

export default FogEffect;
