package com.homekitchen.backend.repository;

import com.homekitchen.backend.model.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByCategory(String category);
    Optional<FoodItem> findByName(String name);
}