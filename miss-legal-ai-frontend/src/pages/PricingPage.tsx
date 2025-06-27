// Pricing Page for MISS Legal AI
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Star, 
  ArrowRight, 
  Users, 
  FileText, 
  Mic, 
  Shield,
  Crown,
  Building,
  CreditCard,
  Globe,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatNaira } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/config';

const PricingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      ...SUBSCRIPTION_PLANS.free,
      id: 'free',
      icon: <Star className="w-6 h-6" />,
      popular: false,
      description: 'Perfect for individuals getting started with legal assistance',
      ctaText: 'Start Free',
      yearlyDiscount: 0,
    },
    {
      ...SUBSCRIPTION_PLANS.premium,
      id: 'premium',
      icon: <Crown className="w-6 h-6" />,
      popular: true,
      description: 'Ideal for professionals and frequent users',
      ctaText: 'Start Premium',
      yearlyDiscount: 20,
    },
    {
      ...SUBSCRIPTION_PLANS.taas,
      id: 'taas',
      icon: <Building className="w-6 h-6" />,
      popular: false,
      description: 'Complete solution for teams and organizations',
      ctaText: 'Contact Sales',
      yearlyDiscount: 25,
    },
  ];

  const daasInfo = SUBSCRIPTION_PLANS.daas;

  const getPrice = (plan: any) => {
    if (plan.id === 'free') return 0;
    const basePrice = plan.price;
    if (isYearly && plan.yearlyDiscount) {
      return Math.floor(basePrice * 12 * (1 - plan.yearlyDiscount / 100));
    }
    return isYearly ? basePrice * 12 : basePrice;
  };

  const getPriceLabel = (plan: any) => {
    if (plan.id === 'free') return 'Free';
    const price = getPrice(plan);
    if (isYearly) {
      return `${formatNaira(price)}/year`;
    }
    return `${formatNaira(price)}/month`;
  };

  const features = [
    {
      category: 'Voice AI Features',
      icon: <Mic className="w-5 h-5" />,
      items: [
        { name: 'Voice Conversations', free: '5/month', premium: 'Unlimited', taas: 'Unlimited' },
        { name: 'Multi-language Support', free: 'English only', premium: 'All 5 languages', taas: 'All 5 languages' },
        { name: 'Voice Quality', free: 'Standard', premium: 'High Quality', taas: 'Premium Quality' },
        { name: 'Session Recording', free: false, premium: true, taas: true },
        { name: 'Voice Analytics', free: false, premium: 'Basic', taas: 'Advanced' },
      ]
    },
    {
      category: 'Legal Services',
      icon: <FileText className="w-5 h-5" />,
      items: [
        { name: 'Legal Consultation', free: 'Basic', premium: 'Comprehensive', taas: 'Expert Level' },
        { name: 'Document Generation', free: '1/month', premium: 'Unlimited', taas: 'Unlimited' },
        { name: 'Document Review', free: false, premium: true, taas: true },
        { name: 'Legal Templates', free: 'Basic', premium: 'Premium', taas: 'Enterprise' },
        { name: 'Compliance Checking', free: false, premium: 'NDPR Basic', taas: 'Full Compliance' },
      ]
    },
    {
      category: 'Emergency & Support',
      icon: <Shield className="w-5 h-5" />,
      items: [
        { name: 'Emergency Detection', free: true, premium: true, taas: true },
        { name: 'Emergency Response', free: 'Basic', premium: 'Priority', taas: 'Instant' },
        { name: 'Support Channels', free: 'Email', premium: 'Email + Chat', taas: 'All + Phone' },
        { name: 'Response Time', free: '24-48 hours', premium: '4-12 hours', taas: '1-4 hours' },
        { name: 'Account Manager', free: false, premium: false, taas: true },
      ]
    },
    {
      category: 'Team & Integration',
      icon: <Users className="w-5 h-5" />,
      items: [
        { name: 'User Accounts', free: '1', premium: '1', taas: 'Up to 100' },
        { name: 'Team Management', free: false, premium: false, taas: true },
        { name: 'API Access', free: false, premium: 'Limited', taas: 'Full Access' },
        { name: 'Custom Integrations', free: false, premium: false, taas: true },
        { name: 'White-label Options', free: false, premium: false, taas: 'Available' },
      ]
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Adebayo',
      role: 'Small Business Owner',
      plan: 'Premium',
      content: 'MISS has saved me thousands on legal fees. The document generation is incredible!',
      avatar: '/images/african-professional.jpg',
    },
    {
      name: 'Tech Solutions Ltd',
      role: 'Technology Company',
      plan: 'TaaS',
      content: 'Managing legal compliance for our 50+ team members has never been easier.',
      avatar: '/images/ai-logo.jpg',
    },
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Here you would typically navigate to checkout or show a form
  };

  return (
    <div className="min-h-screen bg-dark-primary text-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Choose Your{' '}
              <span className="text-gradient bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                Legal AI Plan
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              From individuals to enterprises, find the perfect plan for your legal assistance needs.
              All plans include Nigerian legal expertise and NDPR compliance.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-lg ${!isYearly ? 'text-white' : 'text-gray-400'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-purple-600"
              />
              <span className={`text-lg ${isYearly ? 'text-white' : 'text-gray-400'}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Save up to 25%
                </Badge>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card className={`glass-card-hover p-8 h-full relative ${
                  plan.popular ? 'border-purple-500/40 shadow-glow-purple' : ''
                }`}>
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.popular ? 'bg-purple-600' : 'bg-gray-600'
                      }`}>
                        {plan.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                      <div className="text-4xl font-bold text-white mb-1">
                        {getPriceLabel(plan)}
                      </div>
                      {plan.id !== 'free' && isYearly && plan.yearlyDiscount && (
                        <div className="text-sm text-gray-400 line-through">
                          {formatNaira(plan.price * 12)}/year
                        </div>
                      )}
                      {plan.id !== 'free' && (
                        <div className="text-sm text-gray-400">
                          {isYearly ? 'Billed annually' : 'Billed monthly'}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`w-full ${
                        plan.popular ? 'glow-button' : 'glow-button-outline'
                      }`}
                    >
                      {plan.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-white mb-3">Features included:</h4>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* DaaS Option */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <Card className="glass-card p-8">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center mr-4">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{daasInfo.name}</h3>
                      <p className="text-gray-300">Document as a Service</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4">
                    Pay only for the documents you need. Perfect for occasional use or complex legal documents.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {daasInfo.features.map((feature, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    ₦200 - ₦500
                  </div>
                  <div className="text-gray-400 text-sm mb-4">per document</div>
                  <Button className="glow-button-outline">
                    Generate Document
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4 bg-dark-secondary/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 text-white">
              Compare All Features
            </h2>
            <p className="text-xl text-gray-300">
              See exactly what's included in each plan
            </p>
          </motion.div>

          <div className="space-y-12">
            {features.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center mr-3">
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{category.category}</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-3 text-gray-300">Feature</th>
                          <th className="text-center py-3 text-gray-300">Free</th>
                          <th className="text-center py-3 text-gray-300">Premium</th>
                          <th className="text-center py-3 text-gray-300">TaaS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item, itemIndex) => (
                          <tr key={itemIndex} className="border-b border-gray-700/50">
                            <td className="py-3 text-white">{item.name}</td>
                            <td className="py-3 text-center">
                              {typeof item.free === 'boolean' ? (
                                item.free ? (
                                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-gray-500 mx-auto" />
                                )
                              ) : (
                                <span className="text-gray-300">{item.free}</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {typeof item.premium === 'boolean' ? (
                                item.premium ? (
                                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-gray-500 mx-auto" />
                                )
                              ) : (
                                <span className="text-gray-300">{item.premium}</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {typeof item.taas === 'boolean' ? (
                                item.taas ? (
                                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-gray-500 mx-auto" />
                                )
                              ) : (
                                <span className="text-gray-300">{item.taas}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 text-white">
              What Our Users Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                    <Badge className="ml-auto bg-purple-600/20 text-purple-400">
                      {testimonial.plan}
                    </Badge>
                  </div>
                  <p className="text-gray-300 italic">"{testimonial.content}"</p>
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of Nigerians who trust MISS for their legal needs.
              Start your free trial today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/talk">
                <Button className="glow-button text-lg px-8 py-4 h-auto">
                  <Mic className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="glow-button-outline text-lg px-8 py-4 h-auto">
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;