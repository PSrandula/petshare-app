
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, auth } from '../firebaseConfig';
import { ref, onValue, query, orderByChild, get } from 'firebase/database';
import { signOut } from 'firebase/auth';

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
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    // Fetch all users' data once to map userId to fullName
    const usersRef = ref(database, 'users');
    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    }).catch(err => {
      console.error("Failed to fetch user data:", err);
      // Proceed without user names if this fails
    });

    // Set up real-time listener for posts
    const postsRef = ref(database, 'posts');
    const postsQuery = query(postsRef, orderByChild('createdAt'));

    const unsubscribe = onValue(postsQuery, (snapshot) => {
      const postsData = [];
      snapshot.forEach((childSnapshot) => {
        postsData.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      setPosts(postsData.reverse());
      setLoading(false);
    }, (err) => {
      setError('Failed to fetch posts. Please try again later.');
      console.error(err);
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
    }
  };

  const getDisplayName = () => {
    if (user) {
      return user.displayName || user.email || `User ${user.uid.substring(0, 8)}`;
    }
    return 'Anonymous';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🐾 PetShare Feed</h1>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block">Welcome, {getDisplayName()}</span>
            <button
              onClick={() => navigate('/create-post')}
              className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition-transform transform hover:scale-105"
            >
              Create Post
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-transform transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {loading && <div className="text-center text-xl">Loading adorable pets...</div>}
        {error && <div className="text-center text-red-500 text-xl">{error}</div>}
        
        {!loading && !error && (
          posts.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl">🐶</span>
              <p className="text-2xl text-gray-600 mt-4">No posts yet! Be the first to share something adorable 🐾</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img src={post.imageUrl} alt={post.caption || 'User post'} className="w-full h-56 object-cover" />
                  <div className="p-5">
                    <p className="font-semibold text-gray-800 text-lg">{post.caption}</p>
                    <div className="text-sm text-gray-500 mt-3">
                      <p>Posted by: <span className="font-medium text-gray-700">{users[post.userId]?.fullName || 'Anonymous'}</span></p>
                      <p className="mt-1">{timeSince(post.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Feed;
