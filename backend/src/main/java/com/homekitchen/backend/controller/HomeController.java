package com.homekitchen.backend.controller;

import com.homekitchen.backend.model.FoodItem;
import com.homekitchen.backend.service.FoodService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.homekitchen.backend.dto.ApiResponse;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5173/"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/foods")
public class HomeController {
    private final FoodService foodService;

    public HomeController(FoodService foodService) {
        this.foodService = foodService;
    }

    @GetMapping
    public List<FoodItem> getAllFoods() {
        return foodService.getAllFoods();
    }

    @GetMapping("/category/{category}")
    public List<FoodItem> getFoodsByCategory(@PathVariable String category) {
        return foodService.getFoodsByCategory(category);
    }

    @PostMapping
    public FoodItem addFood(@RequestBody FoodItem foodItem) {
        return foodService.addFood(foodItem);
    }

    @PutMapping("/{id}")
    public FoodItem updateFood(@PathVariable Long id, @RequestBody FoodItem updatedFood) {
        return foodService.updateFood(id, updatedFood);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteFood(@PathVariable Long id) {
        foodService.deleteFood(id);
        return ResponseEntity.ok(
                new ApiResponse("Food item deleted successfully")
        );
    }

    @DeleteMapping
    public String deleteAllFoods() {
        foodService.deleteAllFoods();
        return "All food items deleted";
    }
}