package com.zetlan.smartretailmanagement.controller;

import com.zetlan.smartretailmanagement.model.User;
import com.zetlan.smartretailmanagement.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    // In-memory storage for OTPs. In production, use Redis with an expiration timer.
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Registration successful", "id", savedUser.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            String mockToken = UUID.randomUUID().toString();
            return ResponseEntity.ok(Map.of(
                    "token", mockToken,
                    "name", userOpt.get().getName(),
                    "role", userOpt.get().getRole()
            ));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

    // --- NEW: Forgot Password Flow ---

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account not found with this email."));
        }

        // Generate a 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, otp);

        // Simulating sending an email/SMS by printing to the server console
        System.out.println("========== OTP ALERT ==========");
        System.out.println("Email: " + email);
        System.out.println("OTP: " + otp);
        System.out.println("===============================");

        return ResponseEntity.ok(Map.of("message", "OTP sent successfully. Check console."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        if (!otp.equals(otpStorage.get(email))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(newPassword);
            userRepository.save(user); // Commits the new password to the MySQL Database
            otpStorage.remove(email);  // Clear the OTP
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        }

        return ResponseEntity.badRequest().body(Map.of("message", "User not found."));
    }
}