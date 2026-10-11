FROM eclipse-temurin:21-jre

WORKDIR /app

# Update OS packages and remove the unused Pebble executable if present.
RUN set -eu; \
    apt-get update; \
    apt-get upgrade -y; \
    if [ -e /usr/bin/pebble ] || [ -L /usr/bin/pebble ]; then \
      echo "Removing unused Pebble executable"; \
      rm -f /usr/bin/pebble; \
    fi; \
    test ! -e /usr/bin/pebble && test ! -L /usr/bin/pebble; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd --system havlook && \
    useradd --system --gid havlook --create-home havlook

# Copy the application JAR
COPY target/*.jar app.jar

# Give ownership to the non-root user
RUN chown -R havlook:havlook /app

# Run the application as non-root
USER havlook

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]