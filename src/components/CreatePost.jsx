
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white transition-all transform";
  const typeClasses = type === 'success' 
    ? 'bg-gradient-to-r from-green-400 to-blue-500' 
    : 'bg-gradient-to-r from-red-500 to-pink-500';

  return (
    <div className={`${baseClasses} ${typeClasses} animate-slide-in-down`}>
      <p className="font-semibold">{type === 'success' ? 'Success!' : 'Error'}</p>
      <p>{message}</p>
    </div>
  );
};

const CreatePost = () => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!image) {
      showNotification('Please select an image to upload.', 'error');
      return;
    }

    setLoading(true);

    const imgbbApiKey = import.meta.env.VITE_IMGBB_API_KEY;
    const formData = new FormData();
    formData.append('image', image);

    try {
      const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: 'POST',
        body: formData,
      });

      const imgbbResult = await imgbbResponse.json();
      console.log('ImgBB API Response:', imgbbResult);

      if (!imgbbResponse.ok || !imgbbResult.success) {
        throw new Error(imgbbResult.error?.message || 'Image upload failed. Please try again.');
      }
      
      const imageUrl = imgbbResult.data.url;
      const user = auth.currentUser;
      
      if (user) {
        const postsRef = ref(database, 'posts');
        await push(postsRef, {
          imageUrl,
          caption,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });

        showNotification('Post created successfully! Redirecting...', 'success');
        setTimeout(() => {
          navigate('/feed');
        }, 1500); // Redirect after 1.5 seconds
      } else {
        showNotification('You must be logged in to create a post.', 'error');
      }
    } catch (error) {
      console.error('Submission Error:', error);
      showNotification(error.message, 'error');
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
      <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/feed')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
            >
              &larr; Back to Feed
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
              Create a New Post
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="caption" className="block text-lg font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-lg"
                  placeholder="Share something adorable..."
                  rows="5"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-lg font-medium text-gray-700 mb-2">
                  Image
                </label>
                <input
                  type="file"
                  id="image"
                  onChange={handleImageChange}
                  className="w-full text-lg text-gray-500 file:mr-5 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 font-semibold text-white text-lg bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {loading ? 'Uploading...' : 'Create Post'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePost;
