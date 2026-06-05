package com.homekitchen.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Double basePrice;

    private String category;

    private boolean available;

    private String description;

    @OneToMany(
            mappedBy = "foodItem",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonManagedReference
    private List<FoodVariant> variants = new ArrayList<>();

    public FoodItem() {
    }

    public FoodItem(
            String name,
            String category,
            boolean available,
            String description
    ) {
        this.name = name;
        this.category = category;
        this.available = available;
        this.description = description;
    }

}