import Image from 'next/image';
import { Globe, Mail } from 'lucide-react';
import founder1Img from '@/public/images/founders/founder1.1.jpeg';
import founder2Img from '@/public/images/founders/founder2.jpeg';


const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 9 18v4"></path>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function FoundersSection() {
  return (
    <section className="bg-zinc-950 text-white py-24 md:py-32" style={{ background: '#09090b' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-20 text-center md:text-left">
          <p className="text-zinc-400 font-semibold tracking-widest uppercase text-sm mb-2">How It Started.</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">MEET THE MINDS BEHIND</h2>
        </div>

        {/* Founder 1: Subhadeep Dhar */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20 mb-32">
          {/* Image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end order-2 md:order-1">
            <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px]">
              {/* Fallback image path until rembg is finished, then we update it */}
              <Image 
                src={founder1Img}
                alt="Subhadeep Dhar" 
                fill 
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
              />
            </div>
          </div>
          {/* Content */}
          <div className="w-full md:w-1/2 order-1 md:order-2 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-bold mb-2 uppercase">Subhadeep Dhar</h3>
            <p className="text-zinc-400 text-lg mb-6">Co-Founder & Developer</p>
            
            <div className="text-zinc-300 space-y-4 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
              <p>
                As a passionate software developer and tech enthusiast, Subhadeep envisioned Dooars Tutors to bridge the gap between quality education and local accessibility. 
              </p>
              <p>
                With a deep understanding of modern web technologies, he architected the platform to provide a seamless, intuitive experience for both tutors and students across the Dooars region.
              </p>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-5">
              <a href="https://github.com/Subhadeep-Dhar/" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <GithubIcon className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/subhadeep-dhar-030458296/" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <LinkedinIcon className="w-5 h-5" />
              </a>
              <a href="https://portfolio-subhadeep-dhar.vercel.app/" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <Globe className="w-5 h-5" />
              </a>
              <a href="mailto:subhadeepdhar563@gmail.com" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Founder 2: Gourav Deb */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
          {/* Content */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-bold mb-2 uppercase">Gourav Deb</h3>
            <p className="text-zinc-400 text-lg mb-6">Co-Founder & Operations</p>
            
            <div className="text-zinc-300 space-y-4 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
              <p>
                Gourav brings a wealth of strategic insight and operational excellence to Dooars Tutors. Recognizing the untapped potential in the local education sector, he co-founded the platform to empower communities.
              </p>
              <p>
                His dedication to student success and community growth ensures that every tutor on the platform is highly qualified, providing exceptional learning experiences.
              </p>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-5">
              <a href="https://github.com/Gourav-Deb" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <GithubIcon className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/gouravdeb/" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <LinkedinIcon className="w-5 h-5" />
              </a>
              {/* <a href="#" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <Globe className="w-5 h-5" />
              </a> */}
              <a href="mailto:debgourav04@gmail.com" className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          {/* Image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px]">
              <Image 
                src={founder2Img}
                alt="Gourav Deb" 
                fill 
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
