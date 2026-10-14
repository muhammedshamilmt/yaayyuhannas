import { Hero } from "@/components/Landing/Hero";
import { About } from "@/components/Landing/About";
import { Lineup } from "@/components/Landing/Lineup";
import { Schedule } from "@/components/Landing/Schedule";
import { Contact } from "@/components/Landing/Contact";
import { Footer } from "@/components/Landing/Footer";
import { PublicNavbar } from "@/components/Navigation/PublicNavbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-poppins">
      <PublicNavbar />
      <div className="mt-16">
        <Hero />
      </div>
      <About />
      <Lineup />
      <Schedule />
      <Contact />
      <Footer />
    </div>
  );
}