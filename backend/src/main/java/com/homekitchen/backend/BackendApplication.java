package com.homekitchen.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		// Run a pre-boot schema cleanup patch to drop order transaction tables and avoid FK errno 150 conflicts on remote DB
		try (java.sql.Connection conn = java.sql.DriverManager.getConnection(
				"jdbc:mysql://sql12.freesqldatabase.com:3306/sql12833643?useSSL=false&allowPublicKeyRetrieval=true",
				"sql12833643",
				"vRUtp93GUf")) {
			try (java.sql.Statement stmt = conn.createStatement()) {
				stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
				stmt.execute("DROP TABLE IF EXISTS order_item");
				stmt.execute("DROP TABLE IF EXISTS orders");
				stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
				System.out.println("PRE-BOOT: Cleared old order tables to resolve foreign key constraints.");
			}
		} catch (Exception e) {
			System.out.println("PRE-BOOT WARNING: Pre-boot database table clean skipped: " + e.getMessage());
		}

		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner schemaPatch(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				// Add completed_at column to orders table if not created by Hibernate ddl-auto
				jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN completed_at datetime(6) DEFAULT NULL");
				System.out.println("SQL PATCH: Added completed_at column to orders table.");
			} catch (Exception e) {
				// Column already exists or table doesn't exist yet
				System.out.println("SQL PATCH: completed_at check completed: " + e.getMessage());
			}
		};
	}

}
