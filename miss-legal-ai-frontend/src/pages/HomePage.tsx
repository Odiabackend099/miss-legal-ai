// Premium MISS Legal AI Homepage with Million-Dollar Aesthetic
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  PlayCircle, 
  Shield, 
  FileText, 
  Zap, 
  Users, 
  Globe, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Phone,
  MessageCircle,
  Heart,
  Award,
  TrendingUp,
  MapPin,
  Languages,
  Headphones,
  Clock,
  Lock,
  Smartphone
} from 'lucide-react';

// Hero Section Component
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-hero-gradient opacity-90" />
      
      {/* Animated background elements */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-float"
      />
      
      {/* Hero Content */}
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="hero-title mb-6">
            Nigeria's Most Advanced
            <br />
            <span className="glow-text-red">Legal AI Assistant</span>
          </h1>
          
          <p className="hero-subtitle mb-8 max-w-3xl mx-auto">
            Voice-First Legal Support in 5 Nigerian Languages. 
            Get instant legal guidance, generate documents, and access emergency assistance 
            powered by ODIA AI Solutions.
          </p>
          
          {/* ODIA AI Solutions Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-12"
          >
            <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-premium">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-red-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-charcoal-700 font-semibold">Powered by ODIA AI Solutions</span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
        >
          <Link to="/talk" className="premium-button group">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <span>Start Voice Chat Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          <button className="premium-button-cream group">
            <div className="flex items-center space-x-3">
              <PlayCircle className="w-6 h-6" />
              <span>Watch Demo</span>
            </div>
          </button>
        </motion.div>
        
        {/* AI Orb Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative"
        >
          <div className="w-48 h-48 mx-auto orb-gradient rounded-full animate-orb-pulse flex items-center justify-center">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Headphones className="w-16 h-16 text-white animate-pulse" />
            </div>
          </div>
          
          {/* Floating feature badges */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-premium text-sm font-semibold text-blue-700">
              English
            </div>
            <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-premium text-sm font-semibold text-red-700">
              Pidgin
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-premium text-sm font-semibold text-blue-700">
              Yoruba
            </div>
            <div className="absolute top-1/2 -left-8 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-premium text-sm font-semibold text-red-700">
              Hausa
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-charcoal-500"
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm font-medium">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-charcoal-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-charcoal-400 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

// Voice Chat Section
const VoiceChatSection = () => {
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsListening(prev => !prev);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section className="py-24 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">Talk to MISS - Your AI Legal Assistant</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            Experience the future of legal assistance with voice-first interaction. 
            Speak naturally in your preferred Nigerian language and get instant legal guidance.
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Voice Interface Demo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass-card-blue p-12 text-center">
              <div className={`w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                isListening ? 'orb-gradient animate-orb-listening' : 'orb-gradient animate-orb-pulse'
              }`}>
                <MessageCircle className="w-16 h-16 text-white" />
              </div>
              
              {/* Waveform Visualization */}
              <div className="flex items-end justify-center space-x-1 mb-6 h-16">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`voice-wave w-1 transition-all duration-300 ${
                      isListening ? 'animate-wave' : 'h-2'
                    }`}
                    style={{ 
                      height: isListening ? `${Math.random() * 40 + 10}px` : '8px',
                      animationDelay: `${i * 0.1}s` 
                    }}
                  />
                ))}
              </div>
              
              <p className="text-blue-800 font-semibold text-lg mb-4">
                {isListening ? 'Listening...' : 'Tap to speak'}
              </p>
              
              <div className="text-charcoal-600">
                <p className="italic">"Wetin be the legal requirement for house rent agreement for Lagos?"</p>
              </div>
            </div>
          </motion.div>
          
          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="feature-card group">
              <div className="flex items-start space-x-6">
                <div className="feature-icon group-hover:scale-110 transition-transform">
                  <Languages className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">5 Nigerian Languages</h3>
                  <p className="text-charcoal-600">
                    Communicate in English, Pidgin, Yoruba, Hausa, and Igbo. 
                    MISS understands your local language and cultural context.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="feature-card group">
              <div className="flex items-start space-x-6">
                <div className="feature-icon group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">24/7 Availability</h3>
                  <p className="text-charcoal-600">
                    Get legal assistance anytime, anywhere. No appointments needed, 
                    no waiting in line. Just speak and get instant responses.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="feature-card group">
              <div className="flex items-start space-x-6">
                <div className="feature-icon group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">Emergency Detection</h3>
                  <p className="text-charcoal-600">
                    Advanced AI automatically detects legal emergencies and connects you 
                    with appropriate help through WhatsApp and emergency services.
                  </p>
                </div>
              </div>
            </div>
            
            <Link to="/talk" className="premium-button-outline w-full text-center">
              <div className="flex items-center justify-center space-x-3">
                <MessageCircle className="w-5 h-5" />
                <span>Try Voice Chat Now</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Legal Document Generation Section
const DocumentSection = () => {
  const documents = [
    {
      title: 'Tenancy Agreement',
      description: 'Generate comprehensive rental agreements compliant with Nigerian law',
      icon: FileText,
      color: 'blue',
      features: ['Lagos State Compliant', 'Automatic Calculations', 'Digital Signatures']
    },
    {
      title: 'Affidavit',
      description: 'Create sworn statements for various legal purposes',
      icon: Award,
      color: 'red',
      features: ['Court Ready', 'Notary Integration', 'Multiple Templates']
    },
    {
      title: 'Power of Attorney',
      description: 'Draft legally binding authorization documents',
      icon: Users,
      color: 'blue',
      features: ['General & Specific', 'Revocation Clauses', 'State Registration']
    }
  ];
  
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">AI-Powered Legal Document Generation</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            Generate legally compliant documents in minutes, not hours. 
            Our AI understands Nigerian legal requirements and creates documents that meet all regulatory standards.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`feature-card ${doc.color === 'red' ? 'glass-card-red' : 'glass-card-blue'} group`}
            >
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  doc.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                } shadow-${doc.color === 'red' ? 'glow-red' : 'glow-blue'} group-hover:scale-110 transition-transform`}>
                  <doc.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-800 mb-4">{doc.title}</h3>
                <p className="text-charcoal-600 mb-6">{doc.description}</p>
                
                <div className="space-y-2 mb-6">
                  {doc.features.map((feature) => (
                    <div key={feature} className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-charcoal-600">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/documents" className={`${doc.color === 'red' ? 'premium-button-red' : 'premium-button'} w-full text-center`}>
                  Generate Now
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Emergency Response Section
const EmergencySection = () => {
  return (
    <section className="py-24 bg-red-50/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">
            <span className="glow-text-red">Life-Saving</span> Emergency Response
          </h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            When legal emergencies happen, every second counts. 
            Our AI automatically detects urgent situations and connects you with immediate help.
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="glass-card-red p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 mx-auto orb-gradient-red rounded-full animate-emergency-pulse flex items-center justify-center mb-6">
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-800 mb-4">Emergency Detected</h3>
                <p className="text-red-700">Connecting you to immediate assistance...</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-l-4 border-red-500">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-semibold">Calling Emergency Services</span>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-l-4 border-green-500">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-semibold">WhatsApp Alert Sent</span>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-l-4 border-blue-500">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-semibold">Lawyer Notified</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="feature-card">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-glow-red">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">Instant Detection</h3>
                  <p className="text-charcoal-600">
                    Advanced AI algorithms analyze voice patterns and keywords to identify emergency situations in real-time.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-glow-blue">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">WhatsApp Integration</h3>
                  <p className="text-charcoal-600">
                    Automatic alerts sent to emergency contacts and legal network through WhatsApp for immediate response.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glow-blue">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">Nigerian Emergency Services</h3>
                  <p className="text-charcoal-600">
                    Direct integration with all 36 states + FCT emergency services and legal aid organizations.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <TrendingUp className="w-8 h-8 text-red-600" />
                <div>
                  <h4 className="text-lg font-bold text-red-800">Response Time</h4>
                  <p className="text-red-600 text-sm">Average emergency response</p>
                </div>
              </div>
              <div className="text-3xl font-black text-red-700">
                &lt; 30 seconds
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = () => {
  const plans = [
    {
      name: 'Basic',
      price: '₦2,500',
      period: '/month',
      description: 'Perfect for individuals and small legal needs',
      features: [
        'Voice chat with MISS AI',
        'Basic document generation',
        '5 documents per month',
        'English language support',
        'Email support'
      ],
      color: 'blue',
      popular: false
    },
    {
      name: 'Premium',
      price: '₦7,500',
      period: '/month',
      description: 'Best for regular users and small businesses',
      features: [
        'Everything in Basic',
        'All 5 Nigerian languages',
        'Unlimited documents',
        'Emergency detection',
        'WhatsApp integration',
        'Priority support',
        'Lawyer network access'
      ],
      color: 'red',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations and law firms',
      features: [
        'Everything in Premium',
        'Custom integrations',
        'Bulk document processing',
        'Advanced analytics',
        'Dedicated account manager',
        'API access',
        'Custom training'
      ],
      color: 'blue',
      popular: false
    }
  ];

  return (
    <section className="py-24 bg-white/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">Choose Your Plan</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            Transparent pricing with no hidden fees. 
            Start free and upgrade as your legal needs grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`pricing-card ${plan.popular ? 'popular' : ''} relative`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-charcoal-800 mb-2">{plan.name}</h3>
                <p className="text-charcoal-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-black text-gradient">{plan.price}</span>
                  <span className="text-charcoal-500 ml-1">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-charcoal-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                to="/pricing" 
                className={`${plan.popular ? 'premium-button-red' : 'premium-button'} w-full text-center`}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Nigerian Market Features Section
const NigerianMarketSection = () => {
  return (
    <section className="py-24 bg-green-50/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">Built for Nigeria</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            Deep understanding of Nigerian legal system, culture, and languages. 
            Compliant with local regulations and tailored for African business practices.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* State coverage stats */}
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-black text-green-600 mb-2">36</div>
                <div className="text-charcoal-600 text-sm">States Covered</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-black text-blue-600 mb-2">5</div>
                <div className="text-charcoal-600 text-sm">Languages</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-black text-red-600 mb-2">100%</div>
                <div className="text-charcoal-600 text-sm">NDPR Compliant</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-black text-charcoal-600 mb-2">24/7</div>
                <div className="text-charcoal-600 text-sm">Support</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="feature-card">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-glow-blue">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">Local Legal Expertise</h3>
                  <p className="text-charcoal-600">
                    Comprehensive knowledge of Nigerian laws, regulations, and court procedures across all states and FCT.
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glow-blue">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">Cultural Understanding</h3>
                  <p className="text-charcoal-600">
                    AI trained on Nigerian cultural contexts, business practices, and traditional legal customs.
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-glow-red">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal-800 mb-2">NDPR Compliance</h3>
                  <p className="text-charcoal-600">
                    Full compliance with Nigerian Data Protection Regulation and international privacy standards.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Main HomePage Component
const HomePage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <VoiceChatSection />
      <DocumentSection />
      <EmergencySection />
      <PricingSection />
      <NigerianMarketSection />
    </div>
  );
};

export default HomePage;
