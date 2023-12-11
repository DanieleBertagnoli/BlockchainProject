# Use the official MySQL image as the base image
FROM mysql/mysql-server:latest

# Set environment variables for MySQL
ENV MYSQL_ROOT_PASSWORD=password
ENV MYSQL_DATABASE=dragonblock_db
ENV MYSQL_USER=simple_user
ENV MYSQL_PASSWORD=password

EXPOSE 3306

# Copy the initialization script into the container
COPY ./init-script.sql /docker-entrypoint-initdb.d/init-script.sql
