package com.practo.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

@Component
public class JwtFilter extends OncePerRequestFilter  {
    @Autowired
    private JwtUtil jwtUtil;


    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            
            if (jwtUtil.validateToken(token)) {
                // Extract user details from token
                Integer userId = jwtUtil.getUserId(token);
                String role = jwtUtil.getRole(token);
                
                // Create Spring Security authentication
                List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role)
                );
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);
                
                // Set authentication in Spring Security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Also set as request attributes for easy access
                req.setAttribute("userId", userId);
                req.setAttribute("role", role);
            }
        }
        
        chain.doFilter(req, res);
    }
}
