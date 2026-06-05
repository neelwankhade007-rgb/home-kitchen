package com.homekitchen.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
public class FoodVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;

    private double price;

    private boolean available = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_item_id")
    @JsonBackReference
    private FoodItem foodItem;

    public FoodVariant() {
    }

    public FoodVariant(
            String label,
            double price,
            boolean available
    ) {
        this.label = label;
        this.price = price;
        this.available = available;
    }

}