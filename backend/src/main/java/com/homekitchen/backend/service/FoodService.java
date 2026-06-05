package com.homekitchen.backend.service;

import com.homekitchen.backend.exception.FoodException;
import com.homekitchen.backend.model.FoodItem;
import com.homekitchen.backend.model.FoodVariant;
import com.homekitchen.backend.repository.FoodItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodService {

    private final FoodItemRepository repository;

    public FoodService(FoodItemRepository repository) {
        this.repository = repository;
    }

    public List<FoodItem> getAllFoods() {
        return repository.findAll();
    }

    public FoodItem addFood(FoodItem foodItem) {

        if (foodItem.getName() == null || foodItem.getName().isBlank()) {
            throw new FoodException("Food name cannot be empty");
        }

        boolean hasVariants = foodItem.getVariants() != null && !foodItem.getVariants().isEmpty();
        boolean hasBasePrice = foodItem.getBasePrice() != null;

        if (!hasVariants && !hasBasePrice) {
            throw new FoodException("Item must have either a base price or variants");
        }

        if (hasVariants) {
            foodItem.setBasePrice(null);
            for (FoodVariant variant : foodItem.getVariants()) {
                if (variant.getPrice() < 0) {
                    throw new FoodException("Variant price cannot be negative");
                }
                variant.setFoodItem(foodItem);
            }
        } else {
            if (foodItem.getBasePrice() < 0) {
                throw new FoodException("Base price cannot be negative");
            }
        }

        return repository.save(foodItem);
    }

    public void deleteFood(Long id) {

        if (!repository.existsById(id)) {
            throw new FoodException("Food item not found");
        }

        repository.deleteById(id);
    }

    public void deleteAllFoods() {
        repository.deleteAll();
    }

    public FoodItem updateFood(Long id, FoodItem updatedFood) {

        FoodItem foodItem = repository.findById(id)
                .orElseThrow(() -> new FoodException("Food item not found"));

        if (updatedFood.getName() == null || updatedFood.getName().isBlank()) {
            throw new FoodException("Food name cannot be empty");
        }

        boolean hasVariants = updatedFood.getVariants() != null && !updatedFood.getVariants().isEmpty();
        boolean hasBasePrice = updatedFood.getBasePrice() != null;

        if (!hasVariants && !hasBasePrice) {
            throw new FoodException("Item must have either a base price or variants");
        }

        foodItem.setName(updatedFood.getName());
        foodItem.setCategory(updatedFood.getCategory());
        foodItem.setAvailable(updatedFood.isAvailable());
        foodItem.setDescription(updatedFood.getDescription());

        if (hasVariants) {
            foodItem.setBasePrice(null);
            foodItem.getVariants().clear();
            for (FoodVariant variant : updatedFood.getVariants()) {
                if (variant.getPrice() < 0) {
                    throw new FoodException("Variant price cannot be negative");
                }
                variant.setFoodItem(foodItem);
                foodItem.getVariants().add(variant);
            }
        } else {
            if (updatedFood.getBasePrice() < 0) {
                throw new FoodException("Base price cannot be negative");
            }
            foodItem.setBasePrice(updatedFood.getBasePrice());
            foodItem.getVariants().clear();
        }

        return repository.save(foodItem);
    }

    public List<FoodItem> getFoodsByCategory(String category) {
        return repository.findByCategory(category);
    }
}