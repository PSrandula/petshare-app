
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';

const CreatePost = () => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!image) {
      setError('Please select an image to upload.');
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

      if (!imgbbResponse.ok) {
        throw new Error('Image upload failed. Please try again.');
      }

      const imgbbResult = await imgbbResponse.json();
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

        setSuccess('Post created successfully!');
        setCaption('');
        setImage(null);
        if (e.target.reset) {
          e.target.reset(); 
        }
      } else {
        setError('You must be logged in to create a post.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 px-4">
        <div className="flex justify-center mb-4">
            <button
              onClick={() => navigate('/feed')}
              className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
            >
              &larr; Back to Feed
            </button>
        </div>
        <div className="p-8 bg-white rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Create a New Post</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="Write a caption..."
                  rows="4"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  id="image"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Uploading...' : 'Create Post'}
              </button>
            </form>
            {error && <p className="mt-5 text-sm text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
            {success && <p className="mt-5 text-sm text-center text-green-600 bg-green-100 p-3 rounded-lg">{success}</p>}
        </div>
    </div>
  );
};

export default CreatePost;
