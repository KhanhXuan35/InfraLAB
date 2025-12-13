const FREQUENTLY_USED_KEY = "infralab_frequently_used_emojis";
const DAYS_TO_KEEP = 2; // Số ngày giữ lại emoji không được sử dụng

/**
 * Lấy danh sách emoji thường dùng từ localStorage
 * @returns {Array} Mảng các emoji với thông tin { emoji, lastUsed, count }
 */
export const getFrequentlyUsedEmojis = () => {
  try {
    const stored = localStorage.getItem(FREQUENTLY_USED_KEY);
    if (!stored) return [];
    
    const emojis = JSON.parse(stored);
    const now = Date.now();
    const twoDaysInMs = DAYS_TO_KEEP * 24 * 60 * 60 * 1000;
    
    // Lọc và xóa emoji không được sử dụng trong 2 ngày
    const filteredEmojis = emojis.filter((item) => {
      const timeSinceLastUsed = now - item.lastUsed;
      return timeSinceLastUsed <= twoDaysInMs;
    });
    
    // Nếu có emoji bị xóa, cập nhật lại localStorage
    if (filteredEmojis.length !== emojis.length) {
      localStorage.setItem(FREQUENTLY_USED_KEY, JSON.stringify(filteredEmojis));
    }
    
    // Sắp xếp theo số lần sử dụng (giảm dần) và thời gian sử dụng gần nhất
    return filteredEmojis.sort((a, b) => {
      // Ưu tiên số lần sử dụng
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Nếu số lần bằng nhau, ưu tiên emoji được dùng gần nhất
      return b.lastUsed - a.lastUsed;
    });
  } catch (error) {
    console.error("Error getting frequently used emojis:", error);
    return [];
  }
};

/**
 * Lưu emoji vào danh sách thường dùng
 * @param {string} emoji - Emoji cần lưu
 */
export const saveEmojiToFrequentlyUsed = (emoji) => {
  try {
    const emojis = getFrequentlyUsedEmojis();
    const now = Date.now();
    
    // Tìm emoji trong danh sách
    const existingIndex = emojis.findIndex((item) => item.emoji === emoji);
    
    if (existingIndex !== -1) {
      // Cập nhật emoji đã tồn tại
      emojis[existingIndex].count += 1;
      emojis[existingIndex].lastUsed = now;
    } else {
      // Thêm emoji mới
      emojis.push({
        emoji,
        count: 1,
        lastUsed: now,
      });
    }
    
    // Giới hạn tối đa 50 emoji thường dùng
    const sortedEmojis = emojis.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.lastUsed - a.lastUsed;
    });
    
    const limitedEmojis = sortedEmojis.slice(0, 50);
    
    localStorage.setItem(FREQUENTLY_USED_KEY, JSON.stringify(limitedEmojis));
  } catch (error) {
    console.error("Error saving emoji to frequently used:", error);
  }
};

/**
 * Lấy danh sách emoji string để truyền vào emoji-picker-react
 * @returns {Array<string>} Mảng các emoji string
 */
export const getFrequentlyUsedEmojiStrings = () => {
  const emojis = getFrequentlyUsedEmojis();
  return emojis.map((item) => item.emoji);
};

/**
 * Xóa tất cả emoji thường dùng (dùng cho testing hoặc reset)
 */
export const clearFrequentlyUsedEmojis = () => {
  try {
    localStorage.removeItem(FREQUENTLY_USED_KEY);
  } catch (error) {
    console.error("Error clearing frequently used emojis:", error);
  }
};

