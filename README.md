# 🐾 PetShare – A Social Platform for Pet Lovers

PetShare is a modern social media web app built using **React (Vite)** and **Firebase**, allowing pet owners to share adorable photos of their pets.  
The project integrates **Firebase Authentication**, **Realtime Database**, and **ImgBB API** for image uploads.

This was developed with the help of AI prompt engineering using **Firebase Studio (Gemini)**.

---

## 🌐 Live Demo

👉 **[Visit PetShare](https://petshare-10350.web.app/)**  
Deployed using **Firebase Hosting**

---

## 🧭 GitHub Repository

🔗 **[https://github.com/PSrandula/petshare-app.git]**

---

## 🚀 Features

- **Firebase Authentication (Sign Up / Login)**
- **User Profile Data Stored in Realtime Database**
- **Create & View Posts**
- **Image Upload via ImgBB API**
- **Live Feed with Real-Time Updates**
- **Delete Post with Confirmation Modal**
- **Responsive Design (Tailwind CSS)**
- **Deployed via Firebase Hosting**

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|-------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | Firebase (Auth + Realtime DB) |
| Image Hosting | ImgBB API |
| Deployment | Firebase Hosting |
| Version Control | Git + GitHub |

---

## ⚙️ Installation and Setup

Follow these steps to set up PetShare on your local machine:

### 1️⃣ Clone the Repository

git clone https://github.com/PSrandula/petshare-app.git
cd petshare-app

### 2️⃣ Install Dependencies

npm install

### 3️⃣ Configure Environment Variables

Create a .env file in the root directory of the project and add the following values:

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# ImgBB API Key for Image Uploads
VITE_IMGBB_API_KEY="your imgbb api"

The ImgBB API key allows users to upload images when creating a post.
You can replace it with your own key by visiting https://api.imgbb.com/
.
### 4️⃣ Run the Development Server

npm run dev

## ☁️ Firebase Deployment

Build the Project
npm run build

Deploy to Firebase Hosting
firebase deploy


Your app will be live at:
👉 https://petshare-10350.web.app/

## 🤖 AI Prompt Engineering Log

All prompts and AI-assisted development steps are documented in prompts.md
.
This file records the journey from initial setup to final deployment, including all the Firebase + ImgBB integration prompts and generated code.

## 🔒 Firebase Security Rules Example

{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "posts": {
      ".read": true,
      "$postId": {
        ".write": "auth != null"
      }
    }
  }
}
