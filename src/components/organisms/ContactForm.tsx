'use client';

import React, { useState } from 'react';
import { FormField } from '../molecules/FormField';

interface ContactFormData {
  fullName: string;
  email: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  referral: string;
}

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    projectType: '',
    budget: '',
    timeline: '',
    description: '',
    referral: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof ContactFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would integrate with your form submission service
      console.log('Form submitted:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form on successful submission
      setFormData({
        fullName: '',
        email: '',
        projectType: '',
        budget: '',
        timeline: '',
        description: '',
        referral: '',
      });
      
      alert('Thank you! Your inquiry has been sent successfully.');
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Sorry, there was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectTypeOptions = [
    { value: 'website', label: 'Website Development' },
    { value: 'ecommerce', label: 'E-commerce Store' },
    { value: 'funnel', label: 'Sales Funnel' },
    { value: 'branding', label: 'Branding & Design' },
    { value: 'webapp', label: 'Web Application' },
    { value: 'other', label: 'Other' },
  ];

  const budgetOptions = [
    { value: '5k-10k', label: '$5,000 - $10,000' },
    { value: '10k-20k', label: '$10,000 - $20,000' },
    { value: '20k-50k', label: '$20,000 - $50,000' },
    { value: '50k+', label: '$50,000+' },
    { value: 'discuss', label: 'Let\'s Discuss' },
  ];

  const timelineOptions = [
    { value: 'asap', label: 'ASAP' },
    { value: '1-2months', label: '1-2 Months' },
    { value: '3-6months', label: '3-6 Months' },
    { value: '6months+', label: '6+ Months' },
    { value: 'flexible', label: 'Flexible' },
  ];

  return (

      <div className="contact-form-container" id="contact-area">
        <div className="contact-form-content">
          <div className="contact-form-header">
            <h2 className="typo-4xl-extrabold m-0">Request Free Quote</h2>
            <h3 className="typo-2xl-extrabold mt-15">Let's Build Something Powerful Together</h3>
            <p className="typo-lg-medium">
              Whether you need a high-converting website, a sleek funnel, or full branding for your next launch—I'm here to help. 
              Fill out the form below, and I'll get back to you within 48 hours.
            </p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} id="contact-form">
            <FormField
              label="Full Name"
              id="fullName"
              type="text"
              placeholder="Helps personalize communication."
              required
              value={formData.fullName}
              onChange={updateField('fullName')}
            />

            <FormField
              label="Email Address"
              id="email"
              type="email"
              placeholder="Where I'll send your reply."
              required
              value={formData.email}
              onChange={updateField('email')}
            />

            <FormField
              label="Project Type"
              id="projectType"
              type="select"
              placeholder="Select option"
              value={formData.projectType}
              onChange={updateField('projectType')}
              options={projectTypeOptions}
            />

            <FormField
              label="Your Budget Range"
              id="budget"
              type="select"
              placeholder="Select option"
              value={formData.budget}
              onChange={updateField('budget')}
              options={budgetOptions}
            />

            <FormField
              label="Project Timeline"
              id="timeline"
              type="select"
              placeholder="Select option"
              value={formData.timeline}
              onChange={updateField('timeline')}
              options={timelineOptions}
            />

            <FormField
              label="Tell Me About Your Project"
              id="description"
              type="textarea"
              placeholder="What are you hoping to build or achieve?"
              value={formData.description}
              onChange={updateField('description')}
              rows={6}
            />

            <FormField
              label="How Did You Hear About Magneto?"
              id="referral"
              type="text"
              placeholder="Helps improve outreach and marketing."
              value={formData.referral}
              onChange={updateField('referral')}
            />

            <button 
              type="submit" 
              className="btn btn-primary contact-form-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </form>
        </div>
        <div className="contact-form-image">
          <img 
            src="/assets/images/contact-visual.png" 
            alt="Contact us" 
            className="contact-form-img"
          />
        </div>
      </div>
    
  );
};
