"use client";

import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { useState, useEffect } from "react";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Handle body scroll lock when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <div className="relative w-full h-full">
            {/* Background blur effect */}
            <div className="z-[99] fixed pointer-events-none inset-x-0 h-[88px] bg-[rgba(2,6,23,0.8)] backdrop-blur-sm [mask:linear-gradient(to_bottom,#000_20%,transparent_calc(100%-20%))]"></div>

            <header className="fixed top-4 inset-x-0 mx-auto max-w-6xl px-4 md:px-12 z-[100]">
                <nav className="backdrop-blur-lg rounded-xl lg:rounded-2xl border border-[rgba(124,124,124,0.2)] px-4 md:px-6 py-3 opacity-0 animate-[blur-up_1s_cubic-bezier(0.16,1,0.3,1)_2300ms_both]">
                    <div className="flex items-center justify-between">
                        {/* Left side - Logo */}
                        <div className="flex items-center gap-2">
                            <Image 
                                src="/icons/bloom-logo.svg" 
                                alt="Bloom Logo" 
                                width={32} 
                                height={32}
                                className="w-6 h-6"
                            />
                            <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-clash-grotesk)' }}>Bloom</span>
                        </div>

                        {/* Center - Navigation items (Desktop) */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link 
                                href="#features" 
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Features
                            </Link>
                            <Link 
                                href="#demo" 
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Demo
                            </Link>
                        </div>

                        {/* Right side - CTA Button + Hamburger */}
                        <div className="flex items-center gap-3">
                            <Link 
                                href="https://bloom-ai-dashboard.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden md:inline-flex bg-white text-black px-3 md:px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors items-center gap-2 text-sm md:text-base"
                            >
                                Get started
                                <IconArrowRight size={16} className="hidden sm:block" />
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={toggleMenu}
                                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                                aria-label="Toggle menu"
                            >
                                {isOpen ? (
                                    // Close icon
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                ) : (
                                    // Hamburger icon
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 12h18M3 6h18M3 18h18" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                        <div className="pt-4 pb-2 space-y-4">
                            <Link 
                                href="#features" 
                                onClick={closeMenu}
                                className="block text-gray-300 hover:text-white transition-colors py-2"
                            >
                                Features
                            </Link>
                            <Link 
                                href="#demo" 
                                onClick={closeMenu}
                                className="block text-gray-300 hover:text-white transition-colors py-2"
                            >
                                Demo
                            </Link>
                            <Link 
                                href="https://bloom-ai-dashboard.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMenu}
                                className="block bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-center"
                            >
                                Get started
                                <IconArrowRight size={16} className="inline-block ml-2" />
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>
        </div>
    );
};

export default Navbar;