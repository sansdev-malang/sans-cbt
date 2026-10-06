import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { dashboard, login } from '@/routes';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Welcome() {
    const { auth } = usePage().props;
    const containerRef = useRef<HTMLDivElement>(null);
    const starFieldRef = useRef<HTMLDivElement>(null);
    const nebulaRef = useRef<HTMLDivElement>(null);
    const orbitsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Generate Stars with Layers for Parallax Depth
            if (starFieldRef.current) {
                const layers = [
                    { count: 120, speed: 0.2, scale: 0.6 }, // back layer (slowest)
                    { count: 60, speed: 0.5, scale: 1.2 },  // mid layer
                    { count: 20, speed: 1.2, scale: 2.5 }   // front layer (fastest)
                ];

                layers.forEach((layer, index) => {
                    const layerDiv = document.createElement('div');
                    layerDiv.className = `star-layer absolute inset-0 z-0`;
                    layerDiv.dataset.speed = layer.speed.toString();
                    
                    for (let i = 0; i < layer.count; i++) {
                        const star = document.createElement('div');
                        const size = layer.scale * (Math.random() * 1.5 + 0.5);
                        star.style.width = `${size}px`;
                        star.style.height = `${size}px`;
                        star.style.backgroundColor = 'white';
                        star.style.position = 'absolute';
                        star.style.borderRadius = '50%';
                        star.style.left = `${Math.random() * 100}%`;
                        star.style.top = `${Math.random() * 100}%`;
                        star.style.opacity = `${Math.random() * 0.7 + 0.3}`;
                        
                        // Glow for closer stars
                        if (index > 0 && Math.random() > 0.5) {
                            star.style.boxShadow = `0 0 ${size * 4}px rgba(255,255,255,0.8)`;
                        }
                        layerDiv.appendChild(star);
                    }
                    starFieldRef.current?.appendChild(layerDiv);
                });

                // Twinkling effect
                gsap.to('.star-layer div', {
                    opacity: "random(0.2, 1)",
                    duration: "random(1, 3)",
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            }

            // Continuous rotation for rings
            if (orbitsRef.current) {
                gsap.to(orbitsRef.current.children, {
                    rotationZ: "+=360",
                    rotationX: "random(-10, 10)",
                    rotationY: "random(-10, 10)",
                    duration: "random(40, 80)",
                    repeat: -1,
                    ease: "none"
                });
            }

            // Interactive Mouse Parallax
            const handleMouseMove = (e: MouseEvent) => {
                // Normalize mouse coordinates from -1 to 1
                const x = (e.clientX / window.innerWidth - 0.5) * 2;
                const y = (e.clientY / window.innerHeight - 0.5) * 2;

                // Move star layers
                document.querySelectorAll('.star-layer').forEach((layer: any) => {
                    const speed = parseFloat(layer.dataset.speed);
                    gsap.to(layer, {
                        x: x * -30 * speed,
                        y: y * -30 * speed,
                        duration: 1.5,
                        ease: "power2.out",
                        overwrite: "auto"
                    });
                });

                // Move nebula slightly
                if (nebulaRef.current) {
                    gsap.to(nebulaRef.current, {
                        x: x * -50,
                        y: y * -50,
                        duration: 2,
                        ease: "power2.out",
                        overwrite: "auto"
                    });
                }

                // 3D Tilt the orbits wrapper
                if (orbitsRef.current) {
                    gsap.to(orbitsRef.current, {
                        rotationX: -y * 20,
                        rotationY: x * 20,
                        duration: 1.5,
                        ease: "power2.out",
                        overwrite: "auto"
                    });
                }
            };

            window.addEventListener('mousemove', handleMouseMove);

            // Entrance animation for main content
            gsap.from('.hero-element', {
                y: 50,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power3.out",
                delay: 0.2
            });

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
            };

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <>
            <Head title="CBT SD Anak Saleh" />

            <div ref={containerRef} className="min-h-screen bg-[#030305] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
                
                {/* Interactive Starfield - oversized to hide edges when moving */}
                <div ref={starFieldRef} className="absolute -inset-[10%] z-0 pointer-events-none opacity-80" />

                {/* Interactive Nebula */}
                <div ref={nebulaRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-0">
                    <div className="w-[800px] h-[800px] bg-indigo-900/30 rounded-full blur-[150px]" />
                    <div className="absolute w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[120px]" />
                    <div className="absolute w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px]" />
                </div>
                
                {/* Interactive 3D Rings */}
                <div style={{ perspective: '1000px' }} className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
                    <div ref={orbitsRef} style={{ transformStyle: 'preserve-3d' }} className="w-full h-full flex items-center justify-center">
                        <div className="absolute w-[700px] h-[700px] rounded-full border border-white/5" />
                        <div className="absolute w-[550px] h-[550px] rounded-full border border-indigo-400/10" />
                        <div className="absolute w-[400px] h-[400px] rounded-full border border-blue-400/10" />
                        <div className="absolute w-[800px] h-[800px] rounded-full border-t border-purple-500/20" />
                        <div className="absolute w-[650px] h-[650px] rounded-full border-b border-cyan-400/20" />
                    </div>
                </div>

                {/* Main Content */}
                <div className="z-10 flex flex-col items-center text-center px-4 w-full max-w-4xl">
                    
                    {/* Top Badge */}
                    <div className="hero-element flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-white/70">COMPUTER BASED TEST</span>
                    </div>

                    {/* Title */}
                    <div className="hero-element flex flex-col items-center relative z-20">
                        <span className="text-7xl sm:text-[8rem] font-black tracking-tighter leading-none -mt-2 sm:-mt-6">CBT</span>
                        <span className="text-7xl sm:text-[8rem] font-black tracking-tighter leading-none -mt-2 sm:-mt-6">Anak Saleh</span>
                    </div>

                    {/* Modern Tapered Glowing Bar (Smooth & Clean) */}
                    <div className="hero-element relative w-[92%] max-w-2xl flex items-center justify-center my-8">
                        {/* Extended hairline base */}
                        <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

                        {/* Ambient soft glow */}
                        <div className="absolute w-3/4 h-3 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent blur-md" />
                        <div className="absolute w-1/2 h-5 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-lg" />

                        {/* Tapered bar: thin sleek ends & standard center */}
                        <svg
                            viewBox="0 0 1000 8"
                            fill="none"
                            preserveAspectRatio="none"
                            className="w-full h-1.5 sm:h-2 relative z-10"
                        >
                            <path
                                d="M 0,4 C 280,3.8 420,1.5 500,1.5 C 580,1.5 720,3.8 1000,4 C 720,4.2 580,6.5 500,6.5 C 420,6.5 280,4.2 0,4 Z"
                                fill="url(#hero-bar-gradient)"
                            />
                            <defs>
                                <linearGradient id="hero-bar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset="15%" stopColor="rgba(99, 102, 241, 0.2)" />
                                    <stop offset="35%" stopColor="rgba(56, 189, 248, 0.7)" />
                                    <stop offset="50%" stopColor="rgba(255, 255, 255, 0.95)" />
                                    <stop offset="65%" stopColor="rgba(56, 189, 248, 0.7)" />
                                    <stop offset="85%" stopColor="rgba(99, 102, 241, 0.2)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Subtitle */}
                    <p className="hero-element text-lg sm:text-2xl font-medium text-white/80 max-w-2xl leading-relaxed">
                        Platform evaluasi pembelajaran siswa SD Anak Saleh yang{' '}
                        <span className="inline-block rounded border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 backdrop-blur-sm mt-1 sm:mt-0 text-indigo-100">
                            aman dan terpercaya
                        </span>
                    </p>

                    {/* Description */}
                    <p className="hero-element mt-6 text-sm sm:text-base text-white/40 max-w-xl font-light">
                        Kerjakan ujian dengan lancar tanpa hambatan, serta pantau hasil evaluasi secara langsung dan otomatis.
                    </p>

                    {/* Buttons */}
                    <div className="hero-element mt-10 flex flex-col sm:flex-row items-center gap-4">
                        <Link 
                            href={auth.user ? dashboard() : login()}
                            className="flex items-center justify-center gap-2 rounded-xl bg-white text-black px-6 py-3 font-semibold transition-all hover:bg-white/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] w-full sm:w-auto"
                        >
                            {auth.user ? 'Masuk Dashboard' : 'Mulai Ujian'} <ArrowRight className="size-4" />
                        </Link>
                        <a 
                            href="#panduan" 
                            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] w-full sm:w-auto"
                        >
                            <BookOpen className="size-4" /> Lihat Panduan
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
