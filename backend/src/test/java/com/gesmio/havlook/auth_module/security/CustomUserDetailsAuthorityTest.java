package com.gesmio.havlook.auth_module.security;

import com.gesmio.havlook.user_module.entity.Role;
import com.gesmio.havlook.user_module.entity.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CustomUserDetailsAuthorityTest {

    private User userWithRole(String roleName) {
        User user = new User();
        Role role = new Role();
        role.setName(roleName);
        user.setRole(role);
        user.setEnabled(true);
        user.setId(1L);
        return user;
    }

    @Test
    void getAuthorities_mapsCustomerRole() {
        CustomUserDetails details = new CustomUserDetails(userWithRole("CUSTOMER"));
        assertEquals(List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_CUSTOMER")),
                details.getAuthorities().stream().toList());
    }

    @Test
    void getAuthorities_stripsExistingRolePrefix() {
        CustomUserDetails details = new CustomUserDetails(userWithRole("ROLE_ADMIN"));
        assertTrue(details.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void getAuthorities_nullRole_returnsEmpty() {
        User user = new User();
        user.setId(1L);
        user.setEnabled(true);
        CustomUserDetails details = new CustomUserDetails(user);
        assertTrue(details.getAuthorities().isEmpty());
    }
}
