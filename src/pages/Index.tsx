import { motion } from "framer-motion";
import { ArrowRight, Command, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { FeaturesSection } from "@/components/features/FeaturesSection";
import { PricingSection } from "@/components/pricing/PricingSection";
import LogoCarousel from "@/components/LogoCarousel";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative container px-4 pt-32 md:pt-40 pb-20"
      >
        {/* Background gradient effects */}
        <div className="absolute inset-0 -z-10 bg-[#0A0A0A]">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block mb-6 px-4 py-2 rounded-full glass"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Command className="w-4 h-4" />
            Live Indian Stock & Mutual Fund Tracking
            <Badge variant="destructive" className="animate-pulse ml-2">LIVE</Badge>
          </span>
        </motion.div>
        
        <div className="max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal mb-6 tracking-tight text-left">
            <span className="text-gray-200">
              <TextGenerateEffect words="AI-Powered Indian" />
            </span>
            <br />
            <span className="text-gradient font-bold">
              <TextGenerateEffect words="Stock Intelligence" />
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl text-left leading-relaxed"
          >
            Monitor <span className="text-primary font-semibold">Nifty 50 and Sensex 30</span> stocks with{" "}
            <span className="text-primary font-semibold">AI-powered insights</span>, 
            real-time analytics, and personalized recommendations.{" "}
            <span className="text-white font-semibold">Experience the future of stock tracking.</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 items-start mb-8"
          >
            <Button 
              size="lg" 
              className="button-gradient shadow-lg hover:shadow-xl transition-all text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start AI Analysis
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10 text-lg px-8"
              onClick={() => navigate("/dashboard")}
            >
              View Live Dashboard 
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Real-time NSE Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>AI-Powered Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Portfolio Analytics</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative mx-auto max-w-6xl mt-20"
        >
          <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-primary/20 hover:border-primary/40 transition-all">
            <img
              src="/lovable-uploads/c32c6788-5e4a-4fee-afee-604b03113c7f.png"
              alt="Stock Tracker Dashboard Preview"
              className="w-full h-auto"
            />
          </div>
          {/* Decorative glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl -z-10 opacity-50" />
        </motion.div>
      </motion.section>

      {/* Logo Carousel */}
      <LogoCarousel />

      {/* Features Section */}
      <div id="features" className="bg-black">
        <FeaturesSection />
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-black">
        <PricingSection />
      </div>

      {/* Testimonials Section */}
      <div className="bg-black">
        <TestimonialsSection />
      </div>

      {/* CTA Section */}
      <section className="container px-4 py-20 relative bg-black">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url("/lovable-uploads/21f3edfb-62b5-4e35-9d03-7339d803b980.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0A0A0A]/80 backdrop-blur-lg border border-white/10 rounded-2xl p-8 md:p-12 text-center relative z-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start tracking?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of investors who track their Indian stocks with our platform.
          </p>
          <Button size="lg" className="button-gradient" onClick={() => navigate("/auth")}>
            Create Account
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <div className="bg-black">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
