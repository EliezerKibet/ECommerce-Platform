import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <div className="fixed top-0 left-0 z-50 p-4">
                <Link
                    href="/"
                    className="flex items-center space-x-2 bg-[#1a1713]/80 hover:bg-[#1a1713] text-[#f3d5a5] py-2 px-4 rounded-md transition duration-300 backdrop-blur-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Home</span>
                </Link>
            </div>

            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/60"></div>
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-bold text-[#f3d5a5] drop-shadow-lg mb-4">
                        Our Sweet Legacy
                    </h1>
                    <p className="text-xl md:text-2xl text-[#f8c15c] max-w-3xl mx-auto">
                        A journey through time, taste, and tradition since 1892
                    </p>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="py-20 bg-[#1a1713]/95">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-[#f3d5a5] mb-16">
                            Our Chocolate Journey Through Time
                        </h2>

                        {/* Timeline Items */}
                        <div className="space-y-16">
                            {/* 1892 - Foundation */}
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                <div className="lg:w-1/2">
                                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/vintage-chocolate-shop-1892.jpg`}
                                            alt="Original chocolate shop from 1892"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-[#f8c15c] text-[#1a1713] px-4 py-2 rounded-full font-bold text-xl">
                                            1892
                                        </div>
                                        <h3 className="text-3xl font-bold text-[#f3d5a5]">The Beginning</h3>
                                    </div>
                                    <p className="text-[#c89b6a] text-lg leading-relaxed">
                                        Giuseppe Moretti, a passionate chocolatier from Turin, Italy, opened our first small
                                        chocolate shop with a simple dream: to create the world&apos;s finest chocolate using
                                        traditional European techniques passed down through generations. With just three copper
                                        kettles and an unwavering commitment to quality, Chocolate Haven was born.
                                    </p>
                                </div>
                            </div>

                            {/* 1920s - Expansion */}
                            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                                <div className="lg:w-1/2">
                                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/chocolate-expansion-1920s.jpg`}
                                            alt="Chocolate factory expansion in the 1920s"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-[#c89b6a] text-[#1a1713] px-4 py-2 rounded-full font-bold text-xl">
                                            1920s
                                        </div>
                                        <h3 className="text-3xl font-bold text-[#f3d5a5]">The Golden Era</h3>
                                    </div>
                                    <p className="text-[#c89b6a] text-lg leading-relaxed">
                                        The roaring twenties brought prosperity and innovation. We established our first
                                        factory, introduced milk chocolate varieties, and began sourcing cacao directly
                                        from plantations in Ecuador and Venezuela. Our signature truffle collection
                                        debuted during this era, becoming an instant classic among chocolate connoisseurs.
                                    </p>
                                </div>
                            </div>

                            {/* 1950s - Innovation */}
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                <div className="lg:w-1/2">
                                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/chocolate-innovation-1950s.jpg`}
                                            alt="Modern chocolate production techniques from 1950s"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-[#f8c15c] text-[#1a1713] px-4 py-2 rounded-full font-bold text-xl">
                                            1950s
                                        </div>
                                        <h3 className="text-3xl font-bold text-[#f3d5a5]">Modern Revolution</h3>
                                    </div>
                                    <p className="text-[#c89b6a] text-lg leading-relaxed">
                                        Post-war innovation led us to revolutionize our production methods while maintaining
                                        artisanal quality. We introduced temperature-controlled tempering, precise conching
                                        techniques, and developed our proprietary bean-to-bar process. This decade marked
                                        our expansion into specialty flavors and seasonal collections.
                                    </p>
                                </div>
                            </div>

                            {/* 1980s - International */}
                            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                                <div className="lg:w-1/2">
                                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/chocolate-international-1980s.jpg`}
                                            alt="International chocolate distribution in 1980s"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-[#c89b6a] text-[#1a1713] px-4 py-2 rounded-full font-bold text-xl">
                                            1980s
                                        </div>
                                        <h3 className="text-3xl font-bold text-[#f3d5a5]">Global Reach</h3>
                                    </div>
                                    <p className="text-[#c89b6a] text-lg leading-relaxed">
                                        Our commitment to quality gained international recognition. We established partnerships
                                        with premium retailers worldwide and began our sustainable sourcing initiative,
                                        working directly with cacao farmers to ensure fair trade practices. Our dark chocolate
                                        collection won its first international awards during this transformative period.
                                    </p>
                                </div>
                            </div>

                            {/* 2000s - Digital Age */}
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                <div className="lg:w-1/2">
                                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/chocolate-digital-2000s.jpg`}
                                            alt="Modern chocolate e-commerce and digital presence"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-[#f8c15c] text-[#1a1713] px-4 py-2 rounded-full font-bold text-xl">
                                            2000s
                                        </div>
                                        <h3 className="text-3xl font-bold text-[#f3d5a5]">Digital Evolution</h3>
                                    </div>
                                    <p className="text-[#c89b6a] text-lg leading-relaxed">
                                        Embracing the digital age, we launched our online platform, bringing artisanal
                                        chocolates directly to customers&apos; doors. We introduced limited edition collections,
                                        personalized gift options, and began sharing our chocolate-making process through
                                        virtual factory tours and masterclasses.
                                    </p>
                                </div>
                            </div>

                            {/* Today - Sustainability */}
                            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                                <div className="lg:w-1/2">
                                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/chocolate-sustainability-today.jpg`}
                                            alt="Modern sustainable chocolate production"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-[#c89b6a] text-[#1a1713] px-4 py-2 rounded-full font-bold text-xl">
                                            Today
                                        </div>
                                        <h3 className="text-3xl font-bold text-[#f3d5a5]">Sustainable Future</h3>
                                    </div>
                                    <p className="text-[#c89b6a] text-lg leading-relaxed">
                                        Today, we lead the industry in sustainable practices while honoring our heritage.
                                        Our carbon-neutral facilities, ethical sourcing programs, and innovative packaging
                                        solutions demonstrate our commitment to the planet. We continue Giuseppe&apos;s legacy
                                        by crafting exceptional chocolates that bring joy while caring for our world.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Values Section */}
            <div className="py-20 bg-gradient-to-br from-[#c89b6a]/10 to-[#f8c15c]/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-[#f3d5a5] mb-16">
                            Our Core Values
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-[#1a1713]/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-3xl">🌱</span>
                                </div>
                                <h3 className="text-2xl font-bold text-[#f3d5a5] mb-4">Sustainability</h3>
                                <p className="text-[#c89b6a] leading-relaxed">
                                    We&apos;re committed to environmental responsibility through ethical sourcing,
                                    renewable energy, and carbon-neutral operations.
                                </p>
                            </div>
                            <div className="bg-[#1a1713]/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-3xl">👥</span>
                                </div>
                                <h3 className="text-2xl font-bold text-[#f3d5a5] mb-4">Community</h3>
                                <p className="text-[#c89b6a] leading-relaxed">
                                    Supporting cacao farming communities through fair trade partnerships and
                                    educational initiatives that improve livelihoods.
                                </p>
                            </div>
                            <div className="bg-[#1a1713]/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-3xl">⭐</span>
                                </div>
                                <h3 className="text-2xl font-bold text-[#f3d5a5] mb-4">Excellence</h3>
                                <p className="text-[#c89b6a] leading-relaxed">
                                    Uncompromising quality in every step, from bean selection to final packaging,
                                    maintaining our artisanal standards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heritage Showcase */}
            <div className="py-20 bg-[#1a1713]/95">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-[#f3d5a5] mb-16">
                            Heritage & Craftsmanship
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h3 className="text-3xl font-bold text-[#f8c15c]">Traditional Techniques</h3>
                                <p className="text-[#c89b6a] text-lg leading-relaxed">
                                    For over 130 years, we&apos;ve preserved the artisanal chocolate-making techniques
                                    passed down through generations. Our master chocolatiers still hand-temper
                                    premium chocolates using traditional methods, ensuring each piece meets our
                                    exacting standards.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#2a211c]/60 rounded-lg p-4">
                                        <h4 className="text-[#f8c15c] font-bold mb-2">Bean Selection</h4>
                                        <p className="text-[#c89b6a] text-sm">Hand-picked from premium plantations</p>
                                    </div>
                                    <div className="bg-[#2a211c]/60 rounded-lg p-4">
                                        <h4 className="text-[#f8c15c] font-bold mb-2">Conching Process</h4>
                                        <p className="text-[#c89b6a] text-sm">72-hour traditional refining</p>
                                    </div>
                                    <div className="bg-[#2a211c]/60 rounded-lg p-4">
                                        <h4 className="text-[#f8c15c] font-bold mb-2">Tempering</h4>
                                        <p className="text-[#c89b6a] text-sm">Precise temperature control</p>
                                    </div>
                                    <div className="bg-[#2a211c]/60 rounded-lg p-4">
                                        <h4 className="text-[#f8c15c] font-bold mb-2">Aging</h4>
                                        <p className="text-[#c89b6a] text-sm">Minimum 30-day maturation</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="h-96 rounded-2xl overflow-hidden shadow-2xl">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/chocolate-craftsmanship-process.jpg`}
                                        alt="Traditional chocolate craftsmanship process"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="py-20 bg-gradient-to-r from-[#c89b6a] to-[#f8c15c]">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-[#1a1713] mb-6">
                        Taste Our Heritage
                    </h2>
                    <p className="text-[#1a1713] text-xl mb-8 max-w-2xl mx-auto">
                        Experience 130+ years of chocolate mastery. From our family to yours,
                        discover the flavors that have delighted generations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/products"
                            className="bg-[#1a1713] hover:bg-[#2a211c] text-[#f8c15c] font-bold py-4 px-8 rounded-full transition duration-300 text-lg"
                        >
                            Shop Our Collection
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}