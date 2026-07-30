# Lightweight Production Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the pre-compiled Spring Boot executable JAR from Windows target folder
COPY target/*.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Launch application
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]