import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function HomeButton({ onPress }) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.text}>Home</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: 12,
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    text: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});