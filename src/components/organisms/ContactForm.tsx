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


// ...existing code...
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const formBody = new FormData();
    formBody.append('fullName', formData.fullName);
    formBody.append('email', formData.email);
    formBody.append('projectType', formData.projectType);
    formBody.append('budget', formData.budget);
    formBody.append('timeline', formData.timeline);
    formBody.append('description', formData.description);
    formBody.append('referral', formData.referral);

    formBody.append('_wpcf7', '303');
    formBody.append('_wpcf7_version', '5.9.3');
    formBody.append('_wpcf7_locale', 'en_US');
    formBody.append('_wpcf7_unit_tag', 'wpcf7-f303-p1-o1');
    formBody.append('_wpcf7_container_post', '0');

    const response = await fetch('https://magneto-cms.local/wp-json/contact-form-7/v1/contact-forms/303/feedback', {
      method: 'POST',
      body: formBody,
      // Do NOT set Content-Type header manually!
    });

    const data = await response.json();
    console.log('Contact Form 7 API response:', data);

    if (data.status === 'mail_sent') {
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
    } else {
      alert(data.message || 'Sorry, there was an error sending your message. Please try again.');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    alert('Sorry, there was an error sending your message. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};



  const projectTypeOptions = [
  { value: 'Website Development', label: 'Website Development' },
  { value: 'E-commerce Store', label: 'E-commerce Store' },
  { value: 'Sales Funnel', label: 'Sales Funnel' },
  { value: 'Branding & Design', label: 'Branding & Design' },
  { value: 'Web Application', label: 'Web Application' },
  { value: 'Other', label: 'Other' },
];

const budgetOptions = [
  { value: '$5,000 - $10,000', label: '$5,000 - $10,000' },
  { value: '$10,000 - $20,000', label: '$10,000 - $20,000' },
  { value: '$20,000 - $50,000', label: '$20,000 - $50,000' },
  { value: '$50,000+', label: '$50,000+' },
  { value: "Let's Discuss", label: "Let's Discuss" },
];

const timelineOptions = [
  { value: 'ASAP', label: 'ASAP' },
  { value: '1-2 Months', label: '1-2 Months' },
  { value: '3-6 Months', label: '3-6 Months' },
  { value: '6+ Months', label: '6+ Months' },
  { value: 'Flexible', label: 'Flexible' },
];

  return (

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
    
  );
};
