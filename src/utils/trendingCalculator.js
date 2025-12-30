/**
 * Calculate trending score for a post
 * Formula: (likes * 2 + comments * 3 + views * 0.1) / age_in_hours^1.5
 * 
 * @param {object} post - Post object with likes, comments, views, createdAt
 * @returns {number} Trending score
 */
export const calculateTrendingScore = (post) => {
  const now = new Date();
  const postDate = new Date(post.createdAt);
  const ageInHours = (now - postDate) / (1000 * 60 * 60);
  
  // Minimum age 0.5 hours to avoid division by very small number
  const age = Math.max(ageInHours, 0.5);
  
  const likeWeight = 2;
  const commentWeight = 3;
  const viewWeight = 0.1;
  
  const engagement = 
    (post.likeCount || 0) * likeWeight +
    (post.commentCount || 0) * commentWeight +
    (post.viewCount || 0) * viewWeight;
  
  // Decay factor: older posts get lower score
  const decayFactor = Math.pow(age, 1.5);
  
  const score = engagement / decayFactor;
  
  return parseFloat(score.toFixed(2));
};

/**
 * Determine if post is trending
 * @param {number} score - Trending score
 * @returns {boolean}
 */
export const isTrending = (score) => {
  return score >= 10; // Threshold untuk trending
};