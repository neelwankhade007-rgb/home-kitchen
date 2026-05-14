package com.homekitchen.backend.repository;

import com.homekitchen.backend.model.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByCategory(String category);
}