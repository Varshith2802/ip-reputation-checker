FROM nginx:stable-alpine

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the frontend application files
COPY index.html /usr/share/nginx/html/index.html

# Expose port 80 to the host
EXPOSE 80
