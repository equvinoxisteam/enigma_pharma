import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { contactAPI } from '../api/contactAPI';

const HelpPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    description: '',
    attachment: null
  });

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create my first pharma RFQ?',
          a: 'Go to "Start Your RFQ" from the dashboard. Complete the project details (molecule, phase, service category), upload your NDA/CDA (required), attach supporting documents (PDF), and submit. Your RFQ will be visible to matching CDMO partners.'
        },
        {
          q: 'What file formats are supported?',
          a: 'NDA/CDA and project documents must be PDF format (max 50MB each). CAD/STL files are not used on Enigma Pharma.'
        },
        {
          q: 'How do I select a CDMO partner?',
          a: 'When CDMOs submit bids on your RFQ, review their profiles, GMP certifications, and match scores. Click "Accept as supplier" to select your manufacturing partner.'
        }
      ]
    },
    {
      category: 'For CDMO Partners',
      questions: [
        {
          q: 'How do I find RFQs matching my capabilities?',
          a: 'Use the Pharma RFQ Pool to browse open projects. Filter by service category, development phase, country, and required GMP. Match scores reflect alignment with your registered service categories and certifications.'
        },
        {
          q: 'How do I submit a bid?',
          a: 'Open an RFQ from the pool, review project and regulatory details, and click "Submit Bid". Provide your proposed lead time and a message to the buyer. NDA documents unlock based on your subscription plan.'
        },
        {
          q: 'What happens after I am selected?',
          a: 'The RFQ appears in "Accepted RFQs". You can update production status, communicate via chat, and manage logistics through delivery.'
        }
      ]
    },
    {
      category: 'RFQ Management',
      questions: [
        {
          q: 'Can I edit an RFQ after submission?',
          a: 'You can edit RFQs in DRAFT status. Once opened for requests, you can only update certain fields. After supplier selection, RFQs cannot be edited.'
        },
        {
          q: 'How do I track production progress?',
          a: 'For buyers: Check the "Production & Chat" tab in your RFQ details. For manufacturers: Update the production status as work progresses.'
        },
        {
          q: 'What are the RFQ statuses?',
          a: 'DRAFT → OPEN_FOR_REQUESTS → REQUESTS_PENDING → SUPPLIER_SELECTED → IN_PRODUCTION → SHIPPED → DELIVERED → CLOSED'
        }
      ]
    },
    {
      category: 'Billing & Payments',
      questions: [
        {
          q: 'How are payments processed?',
          a: 'Enigma facilitates the connection between buyers and manufacturers. Payment terms are negotiated between parties. We recommend using secure payment methods and clear contracts.'
        },
        {
          q: 'Are there any fees?',
          a: 'Buyer accounts are always free with unlimited RFQ publishing. Manufacturer plans (Free, Standard, Pro, Enterprise) control visibility, AI matching, and RFQ response access. See the Pricing page for details.'
        }
      ]
    }
  ];

  const handleFAQToggle = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contactAPI.submit({
        name: user?.fullName || user?.companyName || 'User',
        email: user?.email,
        subject: contactForm.subject,
        message: contactForm.description
      });
      showSuccess('Support request submitted! We will get back to you soon.');
      setContactForm({ subject: '', description: '', attachment: null });
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit support request');
    } finally {
      setSubmitting(false);
    }
  };

  let questionIndex = 0;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-gray-600">Find answers to common questions or contact our support team</p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <a
          href="#faq"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#4881F8] hover:shadow-md transition-all"
        >
          <HelpCircle size={32} className="text-[#4881F8] mb-3" />
          <h3 className="font-semibold mb-2">FAQ</h3>
          <p className="text-sm text-gray-600">Common questions and answers</p>
        </a>
        <a
          href="https://docs.enigma.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#4881F8] hover:shadow-md transition-all"
        >
          <FileText size={32} className="text-[#4881F8] mb-3" />
          <h3 className="font-semibold mb-2">Documentation</h3>
          <p className="text-sm text-gray-600">User guides and tutorials</p>
          <ExternalLink size={16} className="text-[#4881F8] mt-2" />
        </a>
        <a
          href="#contact"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#4881F8] hover:shadow-md transition-all"
        >
          <Mail size={32} className="text-[#4881F8] mb-3" />
          <h3 className="font-semibold mb-2">Contact Support</h3>
          <p className="text-sm text-gray-600">Get help from our team</p>
        </a>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.category}</h3>
              <div className="space-y-2">
                {category.questions.map((faq, qIndex) => {
                  const index = questionIndex++;
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleFAQToggle(index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{faq.q}</span>
                        {openFAQ === index ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </button>
                      {openFAQ === index && (
                        <div className="px-4 pb-4 text-gray-600 border-t border-gray-200 pt-4">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support Form */}
      <div id="contact" className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Contact Support</h2>
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={contactForm.subject}
              onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              required
              placeholder="e.g., Account issue, Feature request, Bug report"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={contactForm.description}
              onChange={(e) => setContactForm(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              required
              placeholder="Please describe your issue or question in detail..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setContactForm(prev => ({ ...prev, attachment: e.target.files[0] }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
            <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
          </div>
          <button
            type="submit"
            className="w-full px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
          >
            Submit Support Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default HelpPage;

