import CryptoJS from 'crypto-js';

// AES-256 Encryption Wrapper
// Note: In real production, Key Management Service (KMS) or similar should be used.
// Here we use Client-Side Key derivation.

export const encryptData = (details: string, secretKey: string): string => {
    try {
        if (!details || !secretKey) return '';
        const ciphertext = CryptoJS.AES.encrypt(details, secretKey).toString();
        return ciphertext;
    } catch (error) {
        console.error("Encryption Failed:", error);
        return '';
    }
};

export const decryptData = (ciphertext: string, secretKey: string): string => {
    try {
        if (!ciphertext || !secretKey) return '';
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (error) {
        // Return empty if decryption fails (wrong password)
        return '';
    }
};

// Simple hash for password verification (one-way)
export const hashPassword = (password: string): string => {
    return CryptoJS.SHA256(password).toString();
};
