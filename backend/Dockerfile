# ==============================================================================
# Multi-stage Dockerfile for Police Camera Mapping System (Spring Boot 3 + Java 21)
# ==============================================================================

# Stage 1: Build stage
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /workspace/app

# Copy maven wrapper and pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Ensure maven wrapper has executable permissions
RUN chmod +x ./mvnw

# Copy source code and build production jar
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal, secure runtime container
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Copy built jar from builder stage
COPY --from=builder --chown=spring:spring /workspace/app/target/*.jar app.jar

# Render injects PORT dynamically (defaults to 8088 if local)
ENV PORT=8088
EXPOSE 8088

# Launch Spring Boot with memory optimization for container environments
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar app.jar"]
