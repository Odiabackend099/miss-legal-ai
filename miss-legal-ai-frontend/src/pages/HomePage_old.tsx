// Home Page for MISS Legal AI
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  Shield, 
  FileText, 
  Users, 
  ArrowRight, 
  Star,
  CheckCircle,
  Headphones,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AIOrb from '@/components/voice/AIOrb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const HomePage: React.FC = () => {
  const [isOrbActive, setIsOrbActive] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Voice-First Legal Assistant",
      description: "Talk to MISS in English, Pidgin, Yoruba, Hausa, or Igbo. Get instant legal advice through natural conversation.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Emergency Detection",
      description: "Advanced AI monitors your voice for distress signals and automatically alerts your emergency contacts.",
      color: "from-red-500 to-red-600"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Legal Document Generation",
      description: "Generate legally compliant tenancy agreements, affidavits, and power of attorney documents.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Nigerian Legal Expertise",
      description: "Specialized knowledge of Nigerian law, NDPR compliance, and local legal requirements.",
      color: "from-green-500 to-green-600"
    }
  ];

  const testimonials = [
    {
      name: "Adunni Okafor",
      role: "Small Business Owner",
      content: "MISS helped me understand my tenancy rights in Lagos. The voice interface made it so easy to get answers in Yoruba!",
      rating: 5
    },
    {
      name: "Ibrahim Musa",
      role: "Tech Entrepreneur",
      content: "The emergency detection saved me during a critical situation. MISS is more than just a legal assistant.",
      rating: 5
    },
    {
      name: "Chioma Eze",
      role: "Freelance Consultant",
      content: "Document generation is incredible. Created a professional contract in minutes with full legal compliance.",
      rating: 5
    }
  ];

  const stats = [
    { label: "Active Users", value: "50,000+", icon: <Users className="w-6 h-6" /> },
    { label: "Documents Generated", value: "25,000+", icon: <FileText className="w-6 h-6" /> },
    { label: "Languages Supported", value: "5", icon: <MessageSquare className="w-6 h-6" /> },
    { label: "Emergency Alerts Sent", value: "1,200+", icon: <Shield className="w-6 h-6" /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [features.length]);

  const handleOrbClick = () => {
    setIsOrbActive(!isOrbActive);
    // Navigate to talk page
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-float animation-delay-300" />
        </div>

        <div className="relative container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Meet{' '}
                <span className="text-gradient bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                  MISS
                </span>
                <br />
                <span className="text-4xl lg:text-5xl text-gray-300">
                  Your AI Legal Assistant
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-300 mb-8 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Voice-first legal guidance for Nigerians. Talk in your language, get instant legal advice, 
                generate documents, and stay protected with emergency detection.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link to="/talk">
                  <Button className="glow-button text-lg px-8 py-4 h-auto">
                    <Headphones className="w-5 h-5 mr-2" />
                    Talk to MISS Now
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" className="glow-button-outline text-lg px-8 py-4 h-auto">
                    View Pricing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>

              {/* Stats Row */}
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start mb-2 text-purple-400">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* AI Orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex justify-center"
            >
              <div className="relative">
                <AIOrb
                  size="xl"
                  isListening={isOrbActive}
                  onClick={handleOrbClick}
                  className="hover:scale-105 transition-transform cursor-pointer"
                />
                
                {/* Floating Feature Cards */}
                <motion.div
                  className="absolute -top-4 -right-12 glass-card p-3 max-w-xs hidden lg:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                >
                  <div className="flex items-center text-sm">
                    <Zap className="w-4 h-4 text-purple-400 mr-2" />
                    <span className="text-gray-300">AI-Powered Legal Advice</span>
                  </div>
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-4 -left-12 glass-card p-3 max-w-xs hidden lg:block"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 1.4 }}
                >
                  <div className="flex items-center text-sm">
                    <Shield className="w-4 h-4 text-red-400 mr-2" />
                    <span className="text-gray-300">Emergency Detection</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-secondary/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Why Choose{' '}
              <span className="text-gradient">MISS Legal AI</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built specifically for Nigerian users with local legal expertise, 
              multi-language support, and cutting-edge AI technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card-hover p-6 h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of Nigerians who trust MISS for their legal needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card p-6 h-full">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600/20 to-purple-800/20">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Start your free trial today and experience the future of legal assistance in Nigeria.
              No credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/talk">
                <Button className="glow-button text-lg px-8 py-4 h-auto">
                  <Mic className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" className="glow-button-outline text-lg px-8 py-4 h-auto">
                  Watch Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center mt-8 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              Free for 5 questions per month • No commitment • Cancel anytime
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;