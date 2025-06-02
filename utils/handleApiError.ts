import { Alert } from "react-native";

export async function handleApiError(error: any) {
    console.error("⚠️ API Error:", error);

    if (error.response) {
        console.error("Response Data:", error.response.data);
        console.error("Response Status:", error.response.status);
        console.error("Response Headers:", error.response.headers);
    } else if (error.request) {
        console.error("No response received:", error.request);
    } else {
        console.error("Error setting up request:", error.message);
    }

    Alert.alert("Error", error.response?.data?.error || "An unexpected error occurred.");
}
