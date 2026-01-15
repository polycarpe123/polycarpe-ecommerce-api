import { Request, Response } from 'express';
import { Category } from '../models/category';
import { Product } from '../models/product';

// Get all categories - PUBLIC
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
};

// Get single category - PUBLIC
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id).populate('createdBy', 'firstName lastName email');
    
    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get category'
    });
  }
};

// Create category - ADMIN ONLY
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { name, description } = req.body;

    const existingCategory = await Category.findOne({ 
      name: new RegExp(`^${name.trim()}$`, 'i') 
    });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        error: 'Category with this name already exists'
      });
      return;
    }

    const newCategory = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

// Update category - ADMIN ONLY
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found'
      });
      return;
    }

    if (name) {
      const existingCategory = await Category.findOne({
        name: new RegExp(`^${name.trim()}$`, 'i'),
        _id: { $ne: id }
      });

      if (existingCategory) {
        res.status(409).json({
          success: false,
          error: 'Another category with this name already exists'
        });
        return;
      }
      
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

// Delete category - ADMIN ONLY
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found'
      });
      return;
    }

    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing products'
      });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};