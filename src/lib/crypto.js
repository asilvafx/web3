import CryptoJS from 'crypto-js';

const secretKey = import.meta.env.SECRET_KEY || 'your-default-secret-key'; // Secure key management

export const encryptPassword = (password) => {
    return CryptoJS.AES.encrypt(password, secretKey).toString();
};

export const decryptPassword = (encryptedPassword) => {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};
