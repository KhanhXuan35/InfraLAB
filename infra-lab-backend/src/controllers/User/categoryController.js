import Category from "../../models/Category.js";

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    console.log('GET /api/categories');
    const categories = await Category.find()
      .sort({ name: 1 });

    console.log(`Found ${categories.length} categories`);

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tên danh mục không được để trống"
      });
    }
    
    const categoryName = name.trim();
    
    // Kiểm tra xem đã tồn tại chưa
    const existing = await Category.findOne({ name: categoryName });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Danh mục đã tồn tại",
        data: existing
      });
    }
    
    // Tạo mới
    const category = await Category.create({
      name: categoryName,
      description: description || ""
    });
    
    res.status(201).json({
      success: true,
      message: "Đã tạo danh mục mới",
      data: category
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

