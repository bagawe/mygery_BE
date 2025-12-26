import prisma from '../../prisma/client.js';

// Buat postingan baru
export const createPost = async (req, res) => {
  // Untuk awal, balas dummy dulu
  res.json({ success: true, message: 'createPost endpoint OK' });
};

// Ambil feed postingan
export const getFeed = async (req, res) => {
  // Untuk awal, balas dummy dulu
  res.json({ success: true, message: 'getFeed endpoint OK' });
};