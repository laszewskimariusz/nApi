"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  MapPin, 
  Plane, 
  Users, 
  Handshake, 
  Calendar, 
  ArrowRight,
  Globe,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";

export default function HomePage() {
  const { isLoggedIn, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');

  // Sync map theme with app theme
  useEffect(() => {
    setMapTheme(theme);
  }, [theme]);

  // Auto redirect logged in users to dashboard
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If logged in, show redirecting message
  if (isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Image 
                src="/logo-pax.png" 
                alt="Topsky.app logo" 
                width={200} 
                height={120} 
                className="object-contain"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-6">
              Topsky.app
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Professional Pilot Dashboard & Aviation Blog
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Real-time ACARS data, flight tracking, and aviation insights for professional pilots and aviation enthusiasts
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Plane className="w-4 h-4 mr-2" />
                ACARS Data
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Globe className="w-4 h-4 mr-2" />
                Pilot Dashboard
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Zap className="w-4 h-4 mr-2" />
                Real-time Tracking
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Aviation Blog
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="px-8 py-3 text-lg">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Map Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <MapPin className="w-8 h-8 text-primary" />
              Live Flight Map
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Track flights in real-time across the globe with our interactive map
            </p>
          </div>
          
          <Card className="overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <div className="relative w-full h-[600px] bg-muted/20">
                <iframe
                  src={`http://newsky.app/airline/public/map?style=${mapTheme}&token=TKY_pGZRaH8BepiO3yFG6pRIfHzNFTeMDT`}
                  className="w-full h-full border-0"
                  title="Live Flight Map"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live Data • {mapTheme === 'dark' ? 'Dark' : 'Light'} Theme
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Professional Aviation Tools
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything pilots need for flight planning, tracking, and aviation insights
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plane className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>ACARS Data Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Real-time ACARS messages and flight data directly from aircraft communication systems.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Pilot Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Comprehensive dashboard with flight tracking, weather data, and operational insights for pilots.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Aviation Blog</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Latest aviation news, pilot insights, and industry analysis from aviation professionals.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Flight Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced analytics and reporting tools for flight operations and performance analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Global Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Worldwide coverage with integration to major aviation networks and data providers.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Interactive Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Beautiful, interactive flight maps with real-time aircraft positions and route visualization.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="news" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                News
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="partners" className="flex items-center gap-2">
                <Handshake className="w-4 h-4" />
                Our Partners
              </TabsTrigger>
            </TabsList>

            <TabsContent value="news" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Aviation News & Insights</h2>
                <p className="text-lg text-muted-foreground">
                  Latest updates from the aviation industry and pilot community
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                      <Plane className="w-16 h-16 text-primary/60" />
                    </div>
                    <CardTitle className="text-lg">ACARS Data Integration</CardTitle>
                    <p className="text-sm text-muted-foreground">December 2024</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Enhanced ACARS data processing with real-time message parsing and improved pilot dashboard integration for better operational awareness.
                    </p>
                    <Button variant="outline" size="sm">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-full h-48 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg mb-4 flex items-center justify-center">
                      <Zap className="w-16 h-16 text-green-500/60" />
                    </div>
                    <CardTitle className="text-lg">Pilot Dashboard 2.0</CardTitle>
                    <p className="text-sm text-muted-foreground">November 2024</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      New pilot dashboard features including weather integration, flight planning tools, and enhanced operational data visualization.
                    </p>
                    <Button variant="outline" size="sm">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg mb-4 flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-blue-500/60" />
                    </div>
                    <CardTitle className="text-lg">Aviation Industry Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">October 2024</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Analysis of current aviation industry trends, new technologies, and their impact on pilot operations and flight safety.
                    </p>
                    <Button variant="outline" size="sm">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Our Aviation Team</h2>
                <p className="text-lg text-muted-foreground">
                  Professional pilots and aviation experts behind Topsky.app
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Plane className="w-12 h-12 text-white" />
                    </div>
                    <CardTitle>Commercial Pilots</CardTitle>
                    <p className="text-muted-foreground">Active Airline Pilots</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Experienced commercial pilots providing real-world insights and operational expertise for our platform development.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <BarChart3 className="w-12 h-12 text-white" />
                    </div>
                    <CardTitle>Aviation Data Analysts</CardTitle>
                    <p className="text-muted-foreground">ACARS Specialists</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Specialists in aviation data analysis and ACARS message processing, ensuring accurate and meaningful insights.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Shield className="w-12 h-12 text-white" />
                    </div>
                    <CardTitle>Aviation Safety Experts</CardTitle>
                    <p className="text-muted-foreground">Safety & Compliance</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Aviation safety professionals ensuring our platform meets the highest industry standards and regulatory requirements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="partners" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Aviation Partners</h2>
                <p className="text-lg text-muted-foreground">
                  Trusted partners in aviation data and professional pilot services
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="text-center hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                      <Globe className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-lg">NewSky ACARS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Primary ACARS data provider delivering real-time aircraft communications and flight data.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:from-green-500/30 group-hover:to-green-500/10 transition-colors">
                      <Plane className="w-10 h-10 text-green-500" />
                    </div>
                    <CardTitle className="text-lg">Airlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Partnership with major airlines for operational data sharing and pilot feedback integration.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-500/10 transition-colors">
                      <BarChart3 className="w-10 h-10 text-blue-500" />
                    </div>
                    <CardTitle className="text-lg">Aviation Authorities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Collaboration with aviation authorities for regulatory compliance and safety standards.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-500/10 transition-colors">
                      <Handshake className="w-10 h-10 text-purple-500" />
                    </div>
                    <CardTitle className="text-lg">Pilot Organizations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Working with pilot unions and professional organizations to enhance pilot tools and resources.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join the Pilot Community?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join professional pilots using Topsky.app for ACARS data, flight tracking, and aviation insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-primary">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
