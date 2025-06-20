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

      <Text className="text-xl font-bold mb-4">MyLeadwell – Terms & Conditions</Text>
      <Text className="text-sm text-gray-600 mb-2">Effective Date: June 19, 2025</Text>

      <Text className="text-lg font-semibold mt-4 mb-2">1. About MyLeadwell</Text>
      <Text className="mb-4">
        MyLeadwell is a lead aggregation company that collects consumer-submitted information and connects it with
        independent service providers in industries such as real estate, mortgage, title, escrow, insurance, home
        inspection, and home services. MyLeadwell is not a service provider itself and does not directly offer any of
        the services mentioned.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">2. Voluntary Submission of Information</Text>
      <Text className="mb-4">
        By filling out and submitting your information through this form, you affirm that:
        {'\n'}- You are submitting your information voluntarily.
        {'\n'}- You are at least 18 years old.
        {'\n'}- You understand that your information will be shared with one or more service providers at MyLeadwell’s discretion.
        {'\n'}You are not obligated to purchase or use any service as a result of submitting your information.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">3. Nature of the Affiliate Involvement</Text>
      <Text className="mb-4">
        The individual or organization who invited you to this form is an independent affiliate of MyLeadwell. They:
        {'\n'}- Are not recommending or referring you to any specific service provider.
        {'\n'}- Are not licensed to provide professional advice or services.
        {'\n'}- May receive compensation from MyLeadwell for helping facilitate the submission of your information.
        {'\n'}This individual or organization is helping collect interest in services for informational purposes only and is
        not engaged in making service recommendations.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">4. No Guarantee or Endorsement of Service Providers</Text>
      <Text className="mb-4">
        MyLeadwell does not:
        {'\n'}- Endorse, guarantee, or recommend any particular provider.
        {'\n'}- Verify the licensing, qualifications, or performance of any provider.
        {'\n'}- Warrant the quality, availability, or pricing of services offered by any provider.
        {'\n'}You are encouraged to independently evaluate and verify any service provider before engaging in a business relationship.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">5. Information We Collect</Text>
      <Text className="mb-4">
        When you submit your information, we collect:
        {'\n'}- Full Name
        {'\n'}- Phone Number
        {'\n'}- Email Address
        {'\n'}- State and County
        {'\n'}This information is collected solely for the purpose of distributing it to third-party service providers.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">6. Use of Your Information</Text>
      <Text className="mb-4">
        Your information may be shared with one or more participating providers in a variety of industries at
        MyLeadwell’s discretion. These providers may contact you via phone, text message (SMS), or email.
        MyLeadwell does not control how third-party providers handle your data after it is shared. If you wish to stop
        receiving communications, you must opt out or unsubscribe directly through the providers who contact you.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">7. Consent to Contact (TCPA Disclosure)</Text>
      <Text className="mb-4">
        By submitting your contact information, you expressly consent to be contacted by or on behalf of participating
        service providers, including via automated phone calls, text messages (SMS), and pre-recorded messages, even if
        your number is on a federal or state Do Not Call list. Consent is not a condition of purchase.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">8. RESPA Compliance</Text>
      <Text className="mb-4">
        MyLeadwell does not provide or accept any compensation for the referral of business in violation of RESPA or
        other applicable laws. No compensation is exchanged for the recommendation or guarantee of specific settlement
        service providers.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">9. Privacy and Data Security</Text>
      <Text className="mb-4">
        We take your privacy seriously. Your information will be handled in accordance with our Privacy Policy, which
        complies with applicable data protection laws, including the California Consumer Privacy Act (CCPA).
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">10. No Obligation</Text>
      <Text className="mb-4">
        Submitting this form does not create a binding agreement between you and any service provider. You are under no
        obligation to purchase services, and you may discontinue the process at any time.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">11. Communications and Opt-Out Responsibility</Text>
      <Text className="mb-4">
        MyLeadwell does not initiate communication with consumers after information has been submitted. All outreach will
        be handled by the third-party providers who receive your data. If you wish to opt out of communications, you must
        make that request directly to the contacting provider. MyLeadwell does not manage unsubscribe or opt-out requests
        on behalf of providers.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">12. Updates to These Terms</Text>
      <Text className="mb-4">
        MyLeadwell reserves the right to modify or update these Terms & Conditions at any time. Updated terms will be
        posted on this page with a revised effective date. Continued use of the platform constitutes acceptance of the
        updated terms.
      </Text>

      <Text className="text-lg font-semibold mt-4 mb-2">13. Contact Us</Text>
      <Text className="mb-12">
        For questions about these Terms or how your information is handled before it is shared, please contact:
        {'\n'}MyLeadwell, LLC
        {'\n'}Email: Info@myleadwell.com
      </Text>
    </ScrollView>
  );
}
