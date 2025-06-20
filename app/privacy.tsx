import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <ScrollView className="p-4 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text className="text-blue-500">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold mb-2">MyLeadwell – Privacy Policy</Text>
      <Text className="text-sm text-gray-600 mb-6">Effective Date: June 19, 2025</Text>

      <Text className="text-lg font-semibold mb-2">1. Overview</Text>
      <Text className="mb-4">
        This Privacy Policy outlines how MyLeadwell, LLC ("MyLeadwell," "we," "us," or "our") collects, uses, and shares information submitted by individuals ("you," "your") through our platform. By accessing or using our services, you agree to the practices described in this Privacy Policy.
      </Text>

      <Text className="text-lg font-semibold mb-2">2. Changes to This Policy</Text>
      <Text className="mb-4">
        We may update this Privacy Policy at any time. Changes will be posted here with a revised effective date. Continued use of our platform after changes constitutes acceptance.
      </Text>

      <Text className="text-lg font-semibold mb-2">3. Information We Collect</Text>
      <Text className="mb-4">
        When you voluntarily submit a lead form, we collect:
        {'\n'}- Full Name
        {'\n'}- Email Address
        {'\n'}- Phone Number
        {'\n'}- State and County
        {'\n'}This data is used solely to distribute your contact information to participating providers.
      </Text>

      <Text className="text-lg font-semibold mb-2">4. How We Use and Share Your Information</Text>
      <Text className="mb-4">
        Your data is shared with providers across real estate, mortgage, title, insurance, and related industries. These providers may contact you directly. MyLeadwell does not contact consumers after submission and does not sell your data to unrelated advertisers.
      </Text>

      <Text className="text-lg font-semibold mb-2">5. Third-Party Responsibilities</Text>
      <Text className="mb-4">
        Once shared, providers are responsible for their own communications and data handling. To opt out, you must contact providers directly.
      </Text>

      <Text className="text-lg font-semibold mb-2">6. Data Security</Text>
      <Text className="mb-4">
        We implement technical and physical safeguards to protect your data. However, no system is foolproof, and we are not liable for third-party breaches.
      </Text>

      <Text className="text-lg font-semibold mb-2">7. Children's Privacy</Text>
      <Text className="mb-4">
        Our services are intended for individuals aged 18 and older. We do not knowingly collect data from children.
      </Text>

      <Text className="text-lg font-semibold mb-2">8. Legal Compliance</Text>
      <Text className="mb-4">
        We comply with applicable U.S. privacy laws, including the California Consumer Privacy Act (CCPA). If you are a California resident, contact us for rights to access, delete, or restrict your data.
      </Text>

      <Text className="text-lg font-semibold mb-2">9. Your Responsibilities</Text>
      <Text className="mb-4">
        You agree not to provide false or misleading information and to use our platform lawfully. You are responsible for the accuracy of your submission.
      </Text>

      <Text className="text-lg font-semibold mb-2">10. Dispute Resolution</Text>
      <Text className="mb-4">
        Disputes are resolved through binding individual arbitration under the American Arbitration Association rules. You waive class action rights. You may opt out of arbitration within 30 days by contacting us.
      </Text>

      <Text className="text-lg font-semibold mb-2">11. Contact Us</Text>
      <Text className="mb-12">
        MyLeadwell, LLC
        {'\n'}38219 Mound Rd, Ste 201
        {'\n'}Sterling Heights, MI 48310
        {'\n'}Phone: 248-270-8017
        {'\n'}Email: Info@myleadwell.com
      </Text>
    </ScrollView>
  );
}
