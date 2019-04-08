#!/bin/bash
echo "My secret is ..." $SECRET > /usr/share/nginx/html/secret.txt
nginx -g "daemon off;"