FROM nginx:latest

# Install njs module for JavaScript scripting in nginx
RUN apt-get update && \
    apt-get install -y nginx-module-njs && \
    rm -rf /var/lib/apt/lists/*

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy njs script for JSON-RPC filtering
COPY jsonrpc-filter.js /etc/nginx/jsonrpc-filter.js

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
