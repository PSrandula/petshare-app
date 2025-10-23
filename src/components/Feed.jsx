import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, auth } from '../firebaseConfig';
import { ref, onValue, query, orderByChild, get, remove, update, push, serverTimestamp } from 'firebase/database';
import { signOut } from 'firebase/auth';

// Utilities
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

// Components
const Toast = ({ message, type, onClose }) => {
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
      <div className="flex items-center">
        {type === 'success' && <span className="mr-2">✅</span>}
        {type === 'warning' && <span className="mr-2">⚠️</span>}
        {type === 'error' && <span className="mr-2">❌</span>}
        <div>
          <p className="font-semibold">{type === 'success' ? 'Success!' : type === 'warning' ? 'Warning!' : 'Error'}</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-modal-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg text-white transition-all transform hover:scale-105 ${
              confirmText === "Delete" 
                ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const LikeButton = ({ postId, currentUser }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const likesRef = ref(database, `posts/${postId}/likes`);
    onValue(likesRef, (snapshot) => {
      const likes = snapshot.val() || {};
      setLikeCount(Object.keys(likes).length);
      setIsLiked(likes[currentUser?.uid] || false);
    });
  }, [postId, currentUser]);

  const toggleLike = () => {
    if (!currentUser) return;
    
    const likeRef = ref(database, `posts/${postId}/likes/${currentUser.uid}`);
    if (isLiked) {
      remove(likeRef);
    } else {
      update(likeRef, {
        timestamp: serverTimestamp(),
        userId: currentUser.uid
      });
    }
  };

  return (
    <button 
      onClick={toggleLike}
      className={`flex items-center space-x-2 p-2 rounded-lg transition-all ${
        isLiked 
          ? 'text-red-500 bg-red-50' 
          : 'text-gray-500 hover:text-red-500 hover:bg-gray-50'
      }`}
    >
      <span className={`text-xl transition-transform ${isLiked ? 'scale-110' : ''}`}>
        {isLiked ? '❤️' : '🤍'}
      </span>
      <span className="font-medium">{likeCount}</span>
    </button>
  );
};

const CommentSection = ({ postId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const commentsRef = ref(database, `posts/${postId}/comments`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const commentsData = [];
      snapshot.forEach((child) => {
        commentsData.push({ id: child.key, ...child.val() });
      });
      setComments(commentsData.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
  }, [postId]);

  const addComment = () => {
    if (!newComment.trim() || !currentUser) return;

    const commentsRef = ref(database, `posts/${postId}/comments`);
    push(commentsRef, {
      text: newComment,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      timestamp: serverTimestamp()
    });
    setNewComment('');
  };

  return (
    <div className="mt-4">
      <button 
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <span>💬</span>
        <span>{comments.length} comments</span>
      </button>

      {showComments && (
        <div className="mt-3 space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addComment()}
            />
            <button 
              onClick={addComment}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Post
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-gray-700">
                    {comment.userEmail?.split('@')[0]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {timeSince(comment.timestamp)}
                  </span>
                </div>
                <p className="text-gray-800 mt-1">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [newCaption, setNewCaption] = useState('');
  const [notification, setNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;
  const menuRef = useRef(null);

  // Fetch users and posts
  useEffect(() => {
    const usersRef = ref(database, 'users');
    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) setUsers(snapshot.val());
    });

    const postsRef = ref(database, 'posts');
    const postsQuery = query(postsRef, orderByChild('createdAt'));
    const unsubscribe = onValue(postsQuery, (snapshot) => {
      const postsData = [];
      snapshot.forEach((child) => {
        postsData.push({ id: child.key, ...child.val() });
      });
      const sortedPosts = postsData.reverse();
      setPosts(sortedPosts);
      setFilteredPosts(sortedPosts);
      setLoading(false);
    }, (err) => {
      setError('Failed to fetch posts.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Search functionality
  useEffect(() => {
    const filtered = posts.filter(post => 
      post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      users[post.userId]?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [searchTerm, posts, users]);

  // Click outside menu handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
      showNotification("Logged out successfully!", "success");
    } catch (error) {
      showNotification("Failed to log out.", "error");
    }
  };

  const handleDeleteClick = (postId) => {
    setPostToDelete(postId);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      const postRef = ref(database, `posts/${postToDelete}`);
      remove(postRef)
        .then(() => {
          showNotification("Post deleted successfully!", "success");
        })
        .catch(() => {
          showNotification("Failed to delete post.", "error");
        });
    }
    setIsModalOpen(false);
    setPostToDelete(null);
  };

  const handleEdit = (post) => {
    setEditingPostId(post.id);
    setNewCaption(post.caption);
    setOpenMenuId(null);
  };

  const handleUpdateCaption = (postId) => {
    if (!newCaption.trim()) {
      showNotification("Caption cannot be empty.", "error");
      return;
    }
    const postRef = ref(database, `posts/${postId}`);
    update(postRef, { 
      caption: newCaption,
      updatedAt: serverTimestamp()
    })
      .then(() => {
        showNotification("Caption updated successfully!", "success");
        setEditingPostId(null);
      })
      .catch(() => showNotification("Failed to update caption.", "error"));
  };

  const getDisplayName = () => user ? user.displayName || user.email.split('@')[0] : 'Anonymous';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading adorable pets... 🐾</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
      />

      {/* Header */}
      <header className="sticky top-0 z-10 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg backdrop-blur-lg bg-opacity-95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🐾</span>
              <h1 className="text-2xl font-bold">PetShare</h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search posts or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <span className="absolute left-3 top-2.5">🔍</span>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="hidden sm:block text-white text-opacity-90">
                Welcome, {getDisplayName()}!
              </span>
              <button 
                onClick={() => navigate('/create-post')}
                className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>📸</span>
                <span>Create Post</span>
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <span className="text-8xl">🐶</span>
            <p className="text-2xl text-gray-600 mt-4">
              {searchTerm ? 'No posts found matching your search! 🧐' : 'No posts yet! Be the first to share something adorable 🐾'}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPosts.map((post, index) => (
            <div 
              key={post.id} 
              className="relative bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-all duration-300 animate-fade-in hover:shadow-2xl"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Post Menu */}
              {user && user.uid === post.userId && (
                <div ref={openMenuId === post.id ? menuRef : null} className="absolute top-3 right-3 z-10">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                    className="p-2 rounded-full bg-white bg-opacity-80 backdrop-blur-sm hover:bg-opacity-100 transition-all shadow-lg"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {openMenuId === post.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl z-20 py-2 border border-gray-100">
                      <button 
                        onClick={() => handleEdit(post)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <span>✏️</span>
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(post.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Post Image */}
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.caption || 'Pet post'} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-20"></div>
              </div>

              {/* Post Content */}
              <div className="p-5">
                {editingPostId === post.id ? (
                  <div className="flex flex-col space-y-3">
                    <textarea 
                      value={newCaption} 
                      onChange={(e) => setNewCaption(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                      placeholder="Update your caption..."
                    />
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleUpdateCaption(post.id)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingPostId(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800 text-lg leading-relaxed">
                      {post.caption}
                    </p>
                    
                    {/* Engagement Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <LikeButton postId={post.id} currentUser={user} />
                      
                      <button className="flex items-center space-x-2 p-2 text-gray-500 hover:text-blue-500 transition-colors">
                        <span>🔄</span>
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    <CommentSection postId={post.id} currentUser={user} />
                  </>
                )}

                {/* Post Metadata */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                      <p className="font-medium text-gray-700">
                        {users[post.userId]?.fullName || 'Anonymous User'}
                      </p>
                      <p className="mt-1 flex items-center space-x-1">
                        <span>🕒</span>
                        <span>{timeSince(post.createdAt)}</span>
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/create-post')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 transition-all duration-300 z-40"
      >
        +
      </button>
    </div>
  );
};

export default Feed;