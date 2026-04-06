import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';

const Forum = () => {
  console.log('Forum component rendering...');

  const { t } = useTranslation();

  // State management
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalThreads, setTotalThreads] = useState(0);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '',
    isAnonymous: true
  });
  const [submittingPost, setSubmittingPost] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [categories] = useState([
    'general',
    'academic_stress',
    'anxiety_depression',
    'relationships',
    'family_issues',
    'peer_pressure',
    'self_esteem',
    'study_motivation',
    'career_confusion',
    'social_anxiety'
  ]);

  // Trained peer volunteers from certification system
  const [trainedPeers, setTrainedPeers] = useState([]);

  // Load certified students when component mounts
  useEffect(() => {
    const certified = JSON.parse(localStorage.getItem('trainedStudents') || '[]');
    if (certified.length === 0) {
      const demoPeers = [
        { id: 1, studentName: 'Anonymous Peer #9012', specialization: 'Anxiety Support', status: 'certified', responses: 45 },
        { id: 2, studentName: 'Anonymous Peer #3456', specialization: 'Academic Stress', status: 'certified', responses: 32 },
        { id: 3, studentName: 'Anonymous Peer #7890', specialization: 'Depression Support', status: 'certified', responses: 28 },
      ];
      setTrainedPeers(demoPeers);
    } else {
      setTrainedPeers(certified.map(peer => ({
        ...peer,
        responses: Math.floor(Math.random() * 50) + 10
      })));
    }
  }, []);

  // Check if current user is a certified peer
  const isUserCertifiedPeer = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const trainedStudents = JSON.parse(localStorage.getItem('trainedStudents') || '[]');
    return trainedStudents.some(peer => peer.studentId === user.id);
  };

  // Get peer info for display
  const getPeerInfo = (userId) => {
    const trainedStudents = JSON.parse(localStorage.getItem('trainedStudents') || '[]');
    return trainedStudents.find(peer => peer.studentId === userId);
  };

  // Load threads on component mount and page change
  useEffect(() => {
    fetchThreads();
  }, [currentPage]);

  useEffect(() => {
    console.log('New Post Modal state changed:', showNewPostModal);
  }, [showNewPostModal]);

  const fetchThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching threads from API...');
      const response = await api.get(`/v1/forum/threads?page=${currentPage}&limit=10`);
      console.log('API Response:', response.data);
      setThreads(response.data?.posts || []);
      setTotalPages(response.data?.pagination?.pages || 1);
      setTotalThreads(response.data?.total || 0);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(err.message || 'Failed to load threads. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const filterContent = (content) => {
    const offensiveWords = ['abuse', 'hate', 'violence', 'harm', 'suicide', 'kill'];
    const triggeringWords = ['worthless', 'hopeless', 'ending it all'];
    const lowerContent = content.toLowerCase();
    for (const word of offensiveWords) {
      if (lowerContent.includes(word)) {
        return { blocked: true, reason: 'Contains potentially harmful language' };
      }
    }
    for (const word of triggeringWords) {
      if (lowerContent.includes(word)) {
        return { blocked: true, reason: 'Contains triggering content - redirecting to counselor' };
      }
    }
    return { blocked: false };
  };

  const handleNewPost = async (e) => {
    e.preventDefault();
    const titleLength = newPost.title.trim().length;
    const contentLength = newPost.content.trim().length;
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (titleLength < 5 || titleLength > 200) {
      setError('Title must be between 5 and 200 characters');
      return;
    }
    if (contentLength < 10 || contentLength > 5000) {
      setError('Message must be between 10 and 5000 characters');
      return;
    }
    const dangerousPattern = /<script|<\/script|javascript:|on\w+\s*=/i;
    if (dangerousPattern.test(newPost.title) || dangerousPattern.test(newPost.content)) {
      setError('Posts cannot contain script tags or JavaScript code for security reasons');
      return;
    }
    const titleFilter = filterContent(newPost.title);
    const contentFilter = filterContent(newPost.content);
    if (titleFilter.blocked || contentFilter.blocked) {
      setError(`Post blocked: ${titleFilter.reason || contentFilter.reason}`);
      if (titleFilter.reason?.includes('counselor') || contentFilter.reason?.includes('counselor')) {
        setTimeout(() => { window.location.href = '/booking'; }, 3000);
      }
      return;
    }
    setSubmittingPost(true);
    setError(null);
    try {
      const postData = {
        title: newPost.title.trim(),
        body: newPost.content.trim(),
        tags: [newPost.category || 'general'],
        isAnonymous: newPost.isAnonymous
      };
      const response = await api.post('/v1/forum/posts', postData);
      if (response.data.success) {
        setShowNewPostModal(false);
        setNewPost({ title: '', content: '', category: '', isAnonymous: true });
        if (response.data.warning) {
          setError(response.data.warning);
        } else if (response.data.crisisResources) {
          setError(`${response.data.crisisResources.message} Crisis hotline: ${response.data.crisisResources.crisis_hotline}`);
        } else {
          setError(null);
          console.log('Post created successfully:', response.data.message);
        }
        fetchThreads();
      } else {
        setError(response.data.message || 'Failed to create post. Please try again.');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError(`Validation Error: ${errorMessages}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create post. Please try again.');
      }
    } finally {
      setSubmittingPost(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown date';
      const now = new Date();
      const diffInHours = Math.abs(now - date) / 36e5;
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
      if (diffInHours < 48) return 'Yesterday';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-teal-600 text-white',
      academic_stress: 'bg-teal-700 text-white',
      anxiety_depression: 'bg-teal-500 text-white',
      relationships: 'bg-emerald-600 text-white',
      family_issues: 'bg-green-600 text-white',
      peer_pressure: 'bg-amber-600 text-white',
      self_esteem: 'bg-cyan-600 text-white',
      study_motivation: 'bg-teal-800 text-white',
      career_confusion: 'bg-orange-600 text-white',
      social_anxiety: 'bg-red-600 text-white'
    };
    return colors[category] || colors.general;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThreadClick = async (thread) => {
    console.log('Thread clicked:', thread);
    setSelectedThread(thread);
    setShowThreadModal(true);
    try {
      const threadId = thread._id || thread.id;
      const response = await api.get(`/v1/forum/posts/${threadId}`);
      if (response.data.success) {
        setThreadReplies(response.data.replies || []);
      }
    } catch (err) {
      console.error('Error fetching thread details:', err);
      setError('Failed to load thread details: ' + (err.message || 'Unknown error'));
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const replyLength = replyContent.trim().length;
    if (!replyContent.trim()) {
      setError('Please write a reply message');
      return;
    }
    if (replyLength < 10 || replyLength > 5000) {
      setError('Reply must be between 10 and 5000 characters');
      return;
    }
    const contentFilter = filterContent(replyContent);
    if (contentFilter.blocked) {
      setError(`Reply blocked: ${contentFilter.reason}`);
      if (contentFilter.reason?.includes('counselor')) {
        setTimeout(() => { window.location.href = '/booking'; }, 3000);
      }
      return;
    }
    setSubmittingReply(true);
    setError(null);
    try {
      const parentId = selectedThread._id || selectedThread.id;
      const replyData = {
        title: `Re: ${selectedThread.title}`,
        body: replyContent.trim(),
        parentPost: parentId,
        isAnonymous: true
      };
      const response = await api.post('/v1/forum/posts', replyData);
      if (response.data.success) {
        setReplyContent('');
        handleThreadClick(selectedThread);
        if (response.data.warning) {
          setError(response.data.warning);
        }
      } else {
        setError(response.data.message || 'Failed to post reply. Please try again.');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('Failed to post reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F7F4' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ==================== LEFT COLUMN: MAIN FEED ==================== */}
          <div className="lg:col-span-8 space-y-6">

            {/* Inline Composer */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-teal-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">U</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Start a Discussion</h3>
                  <p className="text-xs text-gray-500">Post anonymously &middot; Trained peers will reply</p>
                </div>
              </div>
              <form onSubmit={handleNewPost} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-colors outline-none"
                    placeholder="Post title..."
                    required
                    minLength={5}
                    maxLength={200}
                  />
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-colors outline-none"
                  >
                    <option value="">Select a category</option>
                    <option value="general">General Support</option>
                    <option value="academic_stress">Academic Stress</option>
                    <option value="anxiety_depression">Anxiety &amp; Depression</option>
                    <option value="relationships">Relationships</option>
                    <option value="family_issues">Family Issues</option>
                    <option value="peer_pressure">Peer Pressure</option>
                    <option value="self_esteem">Self Esteem</option>
                    <option value="study_motivation">Study Motivation</option>
                    <option value="career_confusion">Career Confusion</option>
                    <option value="social_anxiety">Social Anxiety</option>
                  </select>
                </div>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 resize-none transition-colors outline-none"
                  placeholder="Share what's on your mind... (anonymous)"
                  rows={3}
                  required
                  minLength={10}
                  maxLength={5000}
                />
                <div className="flex justify-between items-center pt-1">
                  <div className="text-xs text-gray-400 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Anonymous &amp; content-filtered
                  </div>
                  <button
                    type="submit"
                    disabled={submittingPost || !newPost.title || !newPost.content}
                    className="bg-teal-800 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-teal-900 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingPost ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Feed Header */}
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold text-gray-900">Recent Discussions</h2>
              <span className="text-sm text-gray-500">{totalThreads} posts</span>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200"></div>
                  <div className="animate-spin rounded-full h-14 w-14 border-4 border-teal-800 border-t-transparent absolute top-0"></div>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Loading discussions...</h3>
                  <p className="text-sm text-gray-500">Finding the latest peer support conversations</p>
                </div>
              </div>
            ) : (
              <>
                {/* Threads List */}
                <div className="space-y-4">
                  {threads.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-teal-800 rounded-full flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Discussions Yet</h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">Be the first to start a meaningful conversation in our supportive community.</p>
                    </div>
                  ) : (
                    threads.map((thread) => (
                      <div
                        key={thread.id || thread._id}
                        className="bg-white rounded-2xl border border-gray-100 hover:border-teal-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => handleThreadClick(thread)}
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-teal-800/10 text-teal-800 rounded-full flex items-center justify-center font-bold text-sm">
                              A
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                <span className="font-semibold text-gray-900 text-sm">Anonymous Student</span>
                                <span className="text-gray-400 text-xs">&middot; {formatDate(thread.createdAt)}</span>
                                {thread.tags && thread.tags.length > 0 && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryColor(thread.tags[0])}`}>
                                    {thread.tags[0].replace('_', ' ')}
                                  </span>
                                )}
                                {thread.isPinned && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Pinned</span>
                                )}
                              </div>
                              <h3 className="text-base font-bold text-gray-900 mb-1.5 leading-snug group-hover:text-teal-800 transition-colors">
                                {thread.title}
                              </h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                                {thread.body}
                              </p>
                              <div className="flex items-center text-gray-400 text-xs">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="font-medium">{thread.replyCount || 0} replies</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 py-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Prev</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (page > totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-9 h-9 text-sm font-semibold rounded-xl transition-all ${
                              currentPage === page
                                ? 'text-white bg-teal-800 shadow-md'
                                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {/* ==================== END LEFT COLUMN ==================== */}

          {/* ==================== RIGHT COLUMN: SIDEBAR ==================== */}
          <div className="lg:col-span-4 space-y-6">

            {/* About Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: '#466a65' }}></div>
              <div className="inline-flex items-center justify-center w-11 h-11 bg-teal-50 rounded-xl mb-4 mt-2">
                <svg className="w-5 h-5 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">About Peer Talk</h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Anonymous peer-to-peer discussion board where trained students provide guidance and support. All posts are moderated.
              </p>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Active Discussions</span>
                  <span className="font-semibold text-gray-900">{totalThreads}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Trained Peers</span>
                  <span className="font-semibold text-gray-900">{trainedPeers.length}</span>
                </div>
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Community Guidelines</h3>
              <ul className="space-y-2.5 text-xs text-gray-600">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-1.5 mr-2.5 flex-shrink-0"></span>
                  All posts are anonymous and moderated
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-1.5 mr-2.5 flex-shrink-0"></span>
                  Be kind, respectful and supportive
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-1.5 mr-2.5 flex-shrink-0"></span>
                  Harmful content is automatically filtered
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-1.5 mr-2.5 flex-shrink-0"></span>
                  Crisis content will be redirected to professionals
                </li>
              </ul>
            </div>

            {/* Trained Peers */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-900">Trained Peer Volunteers</h3>
                <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded-full">{trainedPeers.length} active</span>
              </div>
              <div className="space-y-3">
                {trainedPeers.slice(0, 5).map(peer => (
                  <div key={peer.id} className="flex items-center p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-teal-800 text-white rounded-full flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0">
                      P
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-xs truncate">{peer.studentName || peer.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{peer.specialization}</p>
                    </div>
                    <span className="text-[10px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                      {peer.responses} replies
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* ==================== END RIGHT COLUMN ==================== */}

        </div>
      </div>

      {/* ==================== THREAD DETAIL MODAL ==================== */}
      {showThreadModal && selectedThread && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowThreadModal(false)}
          />
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="relative bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900">{selectedThread.title}</h3>
                  <button
                    onClick={() => setShowThreadModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Original Post */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <div className="w-8 h-8 bg-teal-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Anonymous Student</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedThread.createdAt)}</p>
                    </div>
                    {selectedThread.tags && selectedThread.tags.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryColor(selectedThread.tags[0])}`}>
                        {selectedThread.tags[0].replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedThread.body}</p>
                </div>

                {/* Replies */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">
                    Responses ({threadReplies.length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {threadReplies.length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-sm">
                        No responses yet. Be the first to help!
                      </p>
                    ) : (
                      threadReplies.map((reply, index) => {
                        const peerInfo = getPeerInfo(reply.userId);
                        const isCertifiedPeer = !!peerInfo;
                        return (
                          <div key={reply.id || index} className={`rounded-xl p-4 border-l-4 ${
                            isCertifiedPeer
                              ? 'bg-green-50 border-green-400'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                isCertifiedPeer ? 'bg-green-500' : 'bg-gray-400'
                              }`}>
                                {isCertifiedPeer ? 'P' : 'A'}
                              </div>
                              <div>
                                <p className={`text-xs font-semibold ${isCertifiedPeer ? 'text-green-800' : 'text-gray-700'}`}>
                                  {isCertifiedPeer
                                    ? `Certified Peer${peerInfo.specialization ? ` · ${peerInfo.specialization}` : ''}`
                                    : 'Anonymous Student'}
                                </p>
                                <p className="text-[10px] text-gray-500">{formatDate(reply.createdAt)}</p>
                              </div>
                              {isCertifiedPeer && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-medium">Verified</span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm">{reply.body}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReplySubmit} className="space-y-4 border-t border-gray-100 pt-5">
                  {isUserCertifiedPeer() ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center text-xs">
                      <span className="text-green-600 mr-2 text-base">&#127891;</span>
                      <div>
                        <p className="font-semibold text-green-900">Responding as Certified Peer</p>
                        <p className="text-green-700">Your response will be highlighted.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center text-xs">
                      <span className="text-blue-600 mr-2 text-base">&#128172;</span>
                      <div>
                        <p className="font-semibold text-blue-900">Peer Response</p>
                        <p className="text-blue-700">Share supportive thoughts as a community member.</p>
                      </div>
                    </div>
                  )}
                  <textarea
                    id="replyContent"
                    rows={3}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm resize-none outline-none transition-colors ${
                      replyContent.length > 0 && (replyContent.length < 10 || replyContent.length > 5000)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 focus:ring-2 focus:ring-teal-700 focus:border-teal-700'
                    }`}
                    placeholder="Write a supportive response... (min 10 characters)"
                    minLength={10}
                    maxLength={5000}
                    required
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${
                      replyContent.length > 0 && replyContent.length < 10 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {replyContent.length}/5000
                    </span>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowThreadModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReply || replyContent.trim().length < 10}
                        className="px-5 py-2 text-sm font-semibold text-white bg-teal-800 rounded-xl hover:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {submittingReply ? 'Posting...' : 'Post Response'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NEW POST MODAL ==================== */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowNewPostModal(false)}
          />
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="relative bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">Create New Post</h3>
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleNewPost} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center text-xs">
                  <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-blue-900">Anonymous Posting</p>
                    <p className="text-blue-700">Your identity is protected. Only trained peers can respond.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
                  >
                    <option value="">Select a category</option>
                    <option value="general">General Support</option>
                    <option value="academic_stress">Academic Stress</option>
                    <option value="anxiety_depression">Anxiety &amp; Depression</option>
                    <option value="relationships">Relationships</option>
                    <option value="family_issues">Family Issues</option>
                    <option value="peer_pressure">Peer Pressure</option>
                    <option value="self_esteem">Self Esteem</option>
                    <option value="study_motivation">Study Motivation</option>
                    <option value="career_confusion">Career Confusion</option>
                    <option value="social_anxiety">Social Anxiety</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(5-200 chars)</span>
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 ${
                      newPost.title.length > 0 && (newPost.title.length < 5 || newPost.title.length > 200)
                        ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Briefly describe your situation..."
                    minLength={5}
                    maxLength={200}
                    required
                  />
                  <p className={`text-[10px] mt-1 ${
                    newPost.title.length > 0 && newPost.title.length < 5 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {newPost.title.length}/200
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(10-5000 chars)</span>
                  </label>
                  <textarea
                    rows={5}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 ${
                      newPost.content.length > 0 && (newPost.content.length < 10 || newPost.content.length > 5000)
                        ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Share what you're going through..."
                    minLength={10}
                    maxLength={5000}
                    required
                  />
                  <p className={`text-[10px] mt-1 ${
                    newPost.content.length > 0 && newPost.content.length < 10 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {newPost.content.length}/5000
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start text-xs">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-amber-800">Your post will be reviewed by moderators before being published.</p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPostModal(false)}
                    className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPost || newPost.title.trim().length < 5 || newPost.content.trim().length < 10}
                    className="flex-1 py-2.5 px-4 bg-teal-800 text-white rounded-xl text-sm font-semibold hover:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingPost ? 'Submitting...' : 'Submit Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;