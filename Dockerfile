FROM nginx:latest

# Copy nginx configuration
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy njs script for JSON-RPC filtering
COPY jsonrpc-filter.js /etc/nginx/jsonrpc-filter.js

RUN rm /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
