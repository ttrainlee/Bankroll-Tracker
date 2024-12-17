FROM nginx:stable-alpine

# Copy built frontend files
COPY dist/ /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf


# Set the working directory in the container
WORKDIR /usr/share/nginx/html

# Remove default NGINX static files
RUN rm -rf ./*

# Copy the React build files into the container
COPY dist/ .

# Expose port 80 (default for NGINX)
EXPOSE 80

# Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
