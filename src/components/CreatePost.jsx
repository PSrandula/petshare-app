import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white transition-all transform z-50";
  const typeClasses = type === 'success' 
    ? 'bg-gradient-to-r from-green-400 to-blue-500' 
    : type === 'warning'
    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
    : 'bg-gradient-to-r from-red-500 to-pink-500';

  return (
    <div className={`${baseClasses} ${typeClasses} animate-slide-in-down`}>
      <div className="flex items-center space-x-3">
        {type === 'success' && <span className="text-xl">🎉</span>}
        {type === 'warning' && <span className="text-xl">⚠️</span>}
        {type === 'error' && <span className="text-xl">❌</span>}
        <div>
          <p className="font-semibold text-lg">
            {type === 'success' ? 'Success!' : type === 'warning' ? 'Warning!' : 'Error'}
          </p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};

const ImagePreview = ({ image, onRemove }) => {
  return (
    <div className="relative group">
      <img 
        src={URL.createObjectURL(image)} 
        alt="Preview" 
        className="w-full h-64 object-cover rounded-2xl shadow-lg transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-2xl flex items-center justify-center">
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const CreatePost = () => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleCaptionChange = (e) => {
    const value = e.target.value;
    setCaption(value);
    setCharacterCount(value.length);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }
      setImage(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageChange({ target: { files } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!image) {
      showNotification('Please select an image to upload.', 'error');
      return;
    }

    if (caption.length > 500) {
      showNotification('Caption should be less than 500 characters.', 'error');
      return;
    }

    setLoading(true);

    const imgbbApiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!imgbbApiKey) {
      showNotification('Image upload configuration error. Please try again later.', 'error');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('image', image);

    try {
      showNotification('Uploading your adorable pet... 🐾', 'warning');

      const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: 'POST',
        body: formData,
      });

      const imgbbResult = await imgbbResponse.json();

      if (!imgbbResponse.ok || !imgbbResult.success) {
        throw new Error(imgbbResult.error?.message || 'Image upload failed. Please try again.');
      }
      
      const imageUrl = imgbbResult.data.url;
      const user = auth.currentUser;
      
      if (user) {
        const postsRef = ref(database, 'posts');
        await push(postsRef, {
          imageUrl,
          caption: caption.trim(),
          userId: user.uid,
          userEmail: user.email,
          createdAt: serverTimestamp(),
          likes: {},
          comments: {}
        });

        showNotification('Post created successfully! Sharing the cuteness... 🎉', 'success');
        
        setTimeout(() => {
          navigate('/feed');
        }, 2000);
      } else {
        showNotification('You must be logged in to create a post.', 'error');
      }
    } catch (error) {
      console.error('Submission Error:', error);
      showNotification(
        error.message.includes('size') 
          ? 'Image is too large. Please select a smaller image.' 
          : error.message,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => navigate('/feed')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-2xl shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Feed
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">Create Post</h1>
              <p className="text-gray-600 mt-1">Share your pet's cuteness with the world! 🐾</p>
            </div>
            
            <div className="w-24"></div> {/* Spacer for balance */}
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload Section */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-4">
                  Upload Pet Photo 📸
                </label>
                
                {!image ? (
                  <div
                    className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                      dragOver 
                        ? 'border-purple-500 bg-purple-50 scale-105' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-4">
                      <div className="text-6xl">🐕‍🦺</div>
                      <div>
                        <p className="text-xl font-medium text-gray-700">
                          Drag & drop your photo here
                        </p>
                        <p className="text-gray-500 mt-2">or click to browse</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        Supports JPG, PNG, GIF • Max 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <ImagePreview image={image} onRemove={handleRemoveImage} />
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Caption Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label htmlFor="caption" className="block text-lg font-semibold text-gray-800">
                    Caption ✏️
                  </label>
                  <span className={`text-sm ${
                    characterCount > 450 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {characterCount}/500
                  </span>
                </div>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={handleCaptionChange}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-lg placeholder-gray-400"
                  placeholder="Share your pet's story... What makes them special? 🐾"
                  rows="4"
                  maxLength={500}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !image}
                className={`w-full py-4 font-bold text-white text-lg rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  loading || !image
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-2xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Post...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <span>🎉</span>
                    <span>Share with Pet Community</span>
                    <span>🐾</span>
                  </div>
                )}
              </button>

              {/* Tips */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="text-xl mr-2">💡</span>
                  Posting Tips
                </h3>
                <ul className="text-blue-700 space-y-2 text-sm">
                  <li>• Use good lighting for better photos</li>
                  <li>• Show your pet's personality in the caption</li>
                  <li>• Keep captions engaging and friendly</li>
                  <li>• High-quality images get more engagement</li>
                </ul>
              </div>
            </form>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Ready to see other adorable pets?{' '}
              <button
                onClick={() => navigate('/feed')}
                className="text-purple-600 hover:text-purple-700 font-semibold underline transition-colors"
              >
                Browse Feed
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePost;