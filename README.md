# 📊 Advanced Billing & Invoice Management System

A modern, fast, and secure web application built to manage billings, generate professional invoices, and keep track of financial records in real-time. This project is built using modern frontend tools and secured with strict industry-standard practices.

🚀 **Live Demo:** [https://billing-system-application.vercel.app/](https://billing-system-application.vercel.app/)

---

## ✨ Features

* **Real-time Data Sync:** Fully integrated with Firebase for instantaneous data updates and management.
* **Professional Invoice Generation:** Create, customize, and manage billing invoices with ease.
* **Modern & Clean UI:** Responsive design built for a seamless user experience across mobile, tablet, and desktop devices.
* **Secure Architecture:** Built using Vite environment variables to prevent API key leaks and ensure maximum security.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Build Tool:** [Vite.js](https://vitejs.dev/) (For ultra-fast development and optimized production builds)
* **Backend / Database:** [Firebase](https://firebase.google.com/) (Authentication & Firestore/Realtime Database)
* **Hosting:** [Vercel](https://vercel.com/)

---

## 🔒 Security & Environment Variables

This project strictly adheres to security best practices. All sensitive configuration constants and Firebase credentials are completely hidden from the source code using Vite environment variables (`.env`).

To run this project locally, create a `.env` file in the root directory and add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id