# Nginx Proxy Fix for MinIO (sugartech)

This document lists the required changes in `/etc/nginx/sites-available/sugartech` to fix MinIO Console object listing (WebSocket) and API proxying.

## 1) MinIO API (minio.sugartech.online)

Issue: The server block exists but is missing `proxy_pass`, so requests never reach MinIO on `:9000`.

Replace the `minio.sugartech.online` block with:

```nginx
server {
    server_name minio.sugartech.online;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100m;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/sugartech.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sugartech.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
}
```

## 2) MinIO Console (minio-console.sugartech.online)

Issue: WebSocket requests to `/ws/objectManager` fail without a dedicated WS location and missing `Host` header.

Update the `minio-console.sugartech.online` block to include `/ws/`:

```nginx
server {
    server_name minio-console.sugartech.online;

    # WebSocket for MinIO Console
    location /ws/ {
        proxy_pass http://127.0.0.1:9001/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/sugartech.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sugartech.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

## 3) Reload Nginx

After editing:

```bash
nginx -t && systemctl reload nginx
```

## 4) MinIO Environment (Docker)

Ensure MinIO knows its public URLs:

```
MINIO_BROWSER_REDIRECT_URL=https://minio-console.sugartech.online
MINIO_SERVER_URL=https://minio.sugartech.online
```

These are already added in `docker-compose.yml` in this repo.
   


