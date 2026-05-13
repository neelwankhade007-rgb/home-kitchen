package com.homekitchen.backend.controller;

import com.homekitchen.backend.model.FoodItem;
import com.homekitchen.backend.repository.FoodItemRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/foods")
public class HomeController {
    private final FoodItemRepository repository;
    public HomeController(FoodItemRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<FoodItem> getAllFoods() {
        return repository.findAll();
    }

    @PostMapping
    public FoodItem addFood(@RequestBody FoodItem foodItem) {
        return repository.save(foodItem);
    }

    @DeleteMapping("/{id}")
    public String deleteFood(@PathVariable Long id) {
        repository.deleteById(id);
        return "Food item deleted successfully";
    }

    @PutMapping("/{id}")
    public FoodItem updateFood(@PathVariable Long id, @RequestBody FoodItem updatedFood) {
        FoodItem foodItem = repository.findById(id).orElseThrow();

        foodItem.setName(updatedFood.getName());
        foodItem.setPrice(updatedFood.getPrice());

        return repository.save(foodItem);
    }
}