import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, BarChart3, Brain, Zap, Shield, Globe, ArrowRight, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";

const Index = () => {
  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Real-Time Market Data",
      description: "Live updates for Nifty 50 and Sensex 30 stocks with sub-second latency"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Insights",
      description: "Advanced analytics and predictions powered by cutting-edge AI models"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Charts",
      description: "Professional-grade candlestick charts with technical indicators"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Optimized performance for instant data access and smooth interactions"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Reliable",
      description: "Bank-grade security with real-time data backup and encryption"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Multi-Exchange",
      description: "Track stocks across NSE and BSE with unified portfolio management"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(74,222,128,0.1),transparent_50%)]" />
        </div>
        
        <div className="container relative z-10 px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8 fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary animate-scale-in">
              <Sparkles className="h-4 w-4" />
              <span>Now with AI-Powered Market Analysis</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-gradient">Smart Investing</span>
              <br />
              Starts Here
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Track Indian stocks in real-time with advanced analytics, AI insights, and professional-grade tools
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="button-gradient text-lg px-8 py-6 group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/live-market">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                  View Live Market
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>50+ Stocks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Real-Time Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>AI Insights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-card/30 backdrop-blur-sm">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to make informed investment decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="card-elevated hover-lift group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: "50+", label: "Tracked Stocks" },
              { value: "< 100ms", label: "Data Latency" },
              { value: "24/7", label: "Monitoring" },
              { value: "99.9%", label: "Uptime" }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2 fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-4xl md:text-5xl font-bold text-gradient">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Start Trading Smarter?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of investors who trust Lokey & Co for their stock market tracking
            </p>
            <Link to="/auth">
              <Button size="lg" className="button-gradient text-lg px-12 py-6">
                Start Free Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/20">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Lokey & Co</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Lokey & Co. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/auth" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link to="/live-market" className="hover:text-foreground transition-colors">
                Live Market
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
