import dotenv from 'dotenv';

dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
    publicRuntimeConfig: {

        address: process.env.ADDRESS,
    },

};

export default nextConfig;