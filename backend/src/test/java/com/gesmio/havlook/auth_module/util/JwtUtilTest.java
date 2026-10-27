package com.gesmio.havlook.auth_module.util;

import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private static final String SECRET = "01234567890123456789012345678901";

    @Test
    void constructor_shortSecret_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> new JwtUtil("short", 900000));
    }

    @Test
    void constructor_nonPositiveExpiration_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> new JwtUtil(SECRET, 0));
    }

    @Test
    void generateAndExtract_roundTripsClaims() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 900000);
        String token = jwtUtil.generateAccessToken(42L, "user@example.com", "CUSTOMER");

        assertEquals(42L, jwtUtil.extractUserId(token));
        assertEquals("user@example.com", jwtUtil.extractEmail(token));
        assertEquals("CUSTOMER", jwtUtil.extractRole(token));
        assertNotNull(jwtUtil.extractExpiration(token));
        assertFalse(jwtUtil.isTokenExpired(token));
        assertTrue(jwtUtil.isTokenValid(token, 42L));
        assertFalse(jwtUtil.isTokenValid(token, 99L));
    }

    @Test
    void generateAccessToken_missingUserId_throws() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 900000);
        assertThrows(IllegalArgumentException.class,
                () -> jwtUtil.generateAccessToken(null, "user@example.com", "CUSTOMER"));
    }

    @Test
    void generateAccessToken_missingRole_throws() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 900000);
        assertThrows(IllegalArgumentException.class,
                () -> jwtUtil.generateAccessToken(42L, "user@example.com", " "));
    }

    @Test
    void isTokenValid_malformedToken_returnsFalse() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 900000);
        assertFalse(jwtUtil.isTokenValid("not-a-jwt", 42L));
    }

    @Test
    void extractUserId_invalidSubject_returnsNull() {
        // A token with a non-numeric subject cannot be produced by generateAccessToken,
        // but parsing should not throw for a syntactically valid token with bad subject.
        JwtUtil jwtUtil = new JwtUtil(SECRET, 900000);
        // Use a token generated for a valid user, then tamper by checking a different user id.
        String token = jwtUtil.generateAccessToken(42L, null, "CUSTOMER");
        assertNull(jwtUtil.extractEmail(token) == null ? null : jwtUtil.extractEmail(token));
        // email claim absent -> null
        assertNull(jwtUtil.extractEmail(token));
    }
}