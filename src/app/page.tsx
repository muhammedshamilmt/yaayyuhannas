import { Hero } from "@/components/Landing/Hero";
import { About } from "@/components/Landing/About";
import { Lineup } from "@/components/Landing/Lineup";
import { Schedule } from "@/components/Landing/Schedule";
import { Contact } from "@/components/Landing/Contact";
import { Footer } from "@/components/Landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-poppins">
      <Hero />
      <About />
      <Lineup />
      <Schedule />
      <Contact />
      <Footer />
    </div>
  );
}