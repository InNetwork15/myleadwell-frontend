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

            <Text className="text-xl font-bold mb-4">MyLeadwell – Privacy Policy</Text>
            <Text className="text-sm text-gray-600 mb-2">Effective Date: June 19, 2025</Text>

            <Text className="text-lg font-semibold mt-4 mb-2">1. Overview</Text>
            <Text className="mb-4">
                This Privacy Policy outlines how MyLeadwell, LLC ("MyLeadwell," "we," "us," or "our") collects, uses, and shares information submitted by individuals ("you," "your") through our platform, including our website and mobile application. By accessing or using our services, you agree to the practices described in this Privacy Policy.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">2. Changes to This Policy</Text>
            <Text className="mb-4">
                We may update this Privacy Policy at any time to reflect changes in our practices or legal obligations. Any updates will be posted on this page with a revised effective date. Your continued use of our platform after changes have been made constitutes your acceptance of the updated terms.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">3. Information We Collect</Text>
            <Text className="mb-4">
                We collect the following information when you voluntarily submit a lead form:
                {'\n'}- Full Name
                {'\n'}- Email Address
                {'\n'}- Phone Number
                {'\n'}- State and County
                {'\n'}This data is collected solely to distribute your contact information to independent service providers.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">4. How We Use and Share Your Information</Text>
            <Text className="mb-4">
                We use your information to connect you with participating providers in real estate, mortgage, title, insurance, inspection, or other home services. These providers may contact you directly. MyLeadwell does not directly market to consumers post-submission. We do not sell your data to unrelated advertisers.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">5. Third-Party Responsibilities</Text>
            <Text className="mb-4">
                Once your information is shared with third-party service providers, MyLeadwell is not responsible for how they use or secure it. If you wish to opt out of communications, you must contact those providers directly.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">6. Data Security</Text>
            <Text className="mb-4">
                We use commercially reasonable technical, administrative, and physical safeguards to protect your information while in our control. However, no method of transmission is 100% secure, and we are not liable for third-party breaches.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">7. Children's Privacy</Text>
            <Text className="mb-4">
                Our platform is intended for users age 18 and older. We do not knowingly collect or solicit personal data from individuals under 18.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">8. Legal Compliance</Text>
            <Text className="mb-4">
                We comply with relevant U.S. privacy laws including the California Consumer Privacy Act (CCPA). If you are a California resident, you may have rights to access, delete, or restrict the sale of your personal data. To make a request, contact us directly using the information below.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">9. Your Responsibilities and Prohibited Use</Text>
            <Text className="mb-4">
                By using our platform, you agree not to submit false or misleading information and not to use our services in any unlawful manner. You are solely responsible for the accuracy of the information you provide.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">10. Dispute Resolution</Text>
            <Text className="mb-4">
                Any dispute arising from your use of MyLeadwell will be resolved through binding individual arbitration in accordance with the rules of the American Arbitration Association. You agree to waive any rights to participate in class actions. You may opt out of arbitration within 30 days of accepting this policy by notifying us in writing.
            </Text>

            <Text className="text-lg font-semibold mt-4 mb-2">11. Contact Us</Text>
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
