package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.model.Category;
import com.zetlan.smartretailmanagement.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category createCategory(Category category) {
        // Because Category is a simple lookup table, we can save the entity directly
        return categoryRepository.save(category);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}