package com.homekitchen.backend.service;

import com.homekitchen.backend.exception.FoodException;
import com.homekitchen.backend.model.FoodItem;
import com.homekitchen.backend.repository.FoodItemRepository;
import com.homekitchen.backend.exception.FoodException;
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
        if (foodItem.getPrice() < 0) {
            throw new FoodException("Price cannot be negative");
        }

        if (foodItem.getName() == null || foodItem.getName().isBlank()) {
            throw new FoodException("Food name cannot be empty");
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
                .orElseThrow();

        foodItem.setName(updatedFood.getName());
        foodItem.setPrice(updatedFood.getPrice());
        foodItem.setCategory(updatedFood.getCategory());
        foodItem.setAvailable(updatedFood.isAvailable());

        return repository.save(foodItem);
    }

    public List<FoodItem> getFoodsByCategory(String category) {
        return repository.findByCategory(category);
    }
}