/**
 * Extract hashtags from text
 * @param {string} text - Text content
 * @returns {string[]} Array of hashtags without #
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  
  // Match #word (alphanumeric + underscore)
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove # and convert to lowercase, remove duplicates
  const hashtags = matches.map(tag => tag.slice(1).toLowerCase());
  return [...new Set(hashtags)];
};

/**
 * Extract mentions from text
 * @param {string} text - Text content
 * @returns {string[]} Array of usernames without @
 */
export const extractMentions = (text) => {
  if (!text) return [];
  
  // Match @username (alphanumeric + underscore)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = text.match(mentionRegex);
  
  if (!matches) return [];
  
  // Remove @ and convert to lowercase, remove duplicates
  const mentions = matches.map(mention => mention.slice(1).toLowerCase());
  return [...new Set(mentions)];
};

/**
 * Highlight hashtags and mentions in text
 * @param {string} text - Text content
 * @returns {string} HTML with links
 */
export const highlightHashtagsAndMentions = (text) => {
  if (!text) return '';
  
  let result = text;
  
  // Highlight hashtags
  result = result.replace(
    /#([a-zA-Z0-9_]+)/g,
    '<a href="/hashtag/$1" class="hashtag">#$1</a>'
  );
  
  // Highlight mentions
  result = result.replace(
    /@([a-zA-Z0-9_]+)/g,
    '<a href="/profile/$1" class="mention">@$1</a>'
  );
  
  return result;
};