import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TermsAndConditionsScreen() {
  const router = useRouter();

  return (
    <ScrollView className="p-4 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text className="text-blue-500">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold mb-2">MyLeadwell – Terms & Conditions</Text>
      <Text className="text-sm text-gray-600 mb-6">Effective Date: June 19, 2025</Text>

      <Text className="text-lg font-semibold mb-2">1. Welcome</Text>
      <Text className="mb-4">
        Welcome to the MyLeadwell platform. These Terms of Use ("Terms") constitute a legal agreement between you ("User") and MyLeadwell, LLC ("we," "us," or "our"). By accessing or using our website, mobile app, or services, you agree to be bound by these Terms.
      </Text>

      <Text className="text-lg font-semibold mb-2">2. Description of Service</Text>
      <Text className="mb-4">
        MyLeadwell is a lead aggregation platform that connects users who submit contact information with independent service providers across industries such as real estate, mortgage, insurance, title, escrow, inspections, and home services. MyLeadwell does not itself provide these services and does not endorse any particular provider.
      </Text>

      <Text className="text-lg font-semibold mb-2">3. Affiliate Role Disclosure</Text>
      <Text className="mb-4">
        The individual who provided you access to this form may be an independent affiliate of MyLeadwell. They are not offering services or making professional referrals. Their role is limited to collecting your consent to share information with our platform. Affiliates may receive compensation from MyLeadwell for submitted leads.
      </Text>

      <Text className="text-lg font-semibold mb-2">4. Information You Provide</Text>
      <Text className="mb-4">
        When you submit your information, you agree that:
        {'\n'}- You are at least 18 years of age
        {'\n'}- You are submitting your information voluntarily
        {'\n'}- You authorize us to share your information with third-party service providers
        {'\n'}- You are not required to use any service as a result of submitting this form
      </Text>

      <Text className="text-lg font-semibold mb-2">5. Use of Your Information</Text>
      <Text className="mb-4">
        Your data may be shared with providers at our discretion, without regard to your industry preferences. You understand that these providers may contact you directly. MyLeadwell does not control how third-party providers use your data and is not responsible for their actions.
      </Text>

      <Text className="text-lg font-semibold mb-2">6. No Guarantee of Results</Text>
      <Text className="mb-4">
        We do not guarantee that submitting your information will result in contact or business with any provider. We make no warranties about the availability, professionalism, or quality of any third-party services.
      </Text>

      <Text className="text-lg font-semibold mb-2">7. Opt-Out Responsibility</Text>
      <Text className="mb-4">
        You must opt out directly with any provider who contacts you. MyLeadwell does not facilitate or process opt-out or unsubscribe requests on behalf of service providers.
      </Text>

      <Text className="text-lg font-semibold mb-2">8. Dispute Resolution and Arbitration</Text>
      <Text className="mb-4">
        You agree that any dispute related to your use of the platform shall be resolved through binding individual arbitration under the rules of the American Arbitration Association. You waive the right to participate in any class or representative action. You may opt out of arbitration within 30 days of first submitting your info by sending written notice to Info@myleadwell.com.
      </Text>

      <Text className="text-lg font-semibold mb-2">9. Prohibited Conduct</Text>
      <Text className="mb-4">
        You agree not to:
        {'\n'}- Submit false or misleading information
        {'\n'}- Use the platform for unlawful, deceptive, or fraudulent purposes
        {'\n'}- Attempt to access data without authorization
        {'\n'}- Disrupt or compromise platform security
      </Text>

      <Text className="text-lg font-semibold mb-2">10. Intellectual Property</Text>
      <Text className="mb-4">
        All text, software, graphics, and other content on the MyLeadwell platform are owned by or licensed to MyLeadwell, LLC. You may not reproduce, distribute, or create derivative works from this content without our written permission.
      </Text>

      <Text className="text-lg font-semibold mb-2">11. Updates to These Terms</Text>
      <Text className="mb-4">
        We may update these Terms periodically. Your continued use of our platform indicates your acceptance of any updates. Material changes will be announced via our platform.
      </Text>

      <Text className="text-lg font-semibold mb-2">12. Contact Us</Text>
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