package com.homekitchen.backend.repository;

import com.homekitchen.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface OrderRepository extends JpaRepository<Order, Long> {
    int countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}