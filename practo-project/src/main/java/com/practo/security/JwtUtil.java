package com.practo.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.practo.entity.Person;
import java.util.Date;
import io.jsonwebtoken.*;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secretKey;
    
    private final long expirationTimeInMs = 3600_000; // 1 hour
    
    public String generateToken(Person person){
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTimeInMs);

        return Jwts.builder()
                .setSubject(String.valueOf(person.getUserId()))
                .claim("role", person.getRole().name())
                .claim("email", person.getEmail())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, secretKey.getBytes())
                .compact();

    }

    public Integer getUserId(String token){
        Claims claims = Jwts.parser()
                .setSigningKey(secretKey.getBytes())
                .parseClaimsJws(token)
                .getBody();
        return Integer.parseInt(claims.getSubject());
    }

    public String getRole(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(secretKey.getBytes())
                .parseClaimsJws(token)
                .getBody();
        return claims.get("role", String.class);
    }

    public boolean validateToken(String token){
        try {
            Jwts.parser().setSigningKey(secretKey.getBytes()).parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public long getExpirationTimeInSeconds() {
        return expirationTimeInMs / 1000;
    }
}
