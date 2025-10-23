
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, auth } from '../firebaseConfig';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { signOut } from 'firebase/auth';

// Helper function to calculate time since creation
const timeSince = (timestamp) => {
  if (!timestamp) return 'Just now';
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const postsRef = ref(database, 'posts');
    const postsQuery = query(postsRef, orderByChild('createdAt'));

    const unsubscribe = onValue(postsQuery, (snapshot) => {
      try {
        const postsData = [];
        snapshot.forEach((childSnapshot) => {
          postsData.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setPosts(postsData.reverse());
      } catch (err) {
        setError('Could not fetch posts. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      setError('Failed to connect to the database.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
      alert('Failed to log out. Please try again.');
    }
  };
  
  const getDisplayName = () => {
    if (user) {
      return user.displayName || user.email || `User: ${user.uid.substring(0, 6)}...`;
    }
    return 'Anonymous';
  };

  if (loading) {
    return <div className="text-center mt-20">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-center mt-20 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {getDisplayName()}</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/create-post')}
            className="px-5 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Create New Post
          </button>
          <button
            onClick={handleLogout}
            className="px-5 py-2 font-semibold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-transform transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
              <img src={post.imageUrl} alt={post.caption} className="w-full h-56 object-cover" />
              <div className="p-5">
                <p className="font-semibold text-gray-900">{post.caption}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
