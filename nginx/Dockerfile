FROM nginx
COPY ./html /usr/share/nginx/html
COPY ./entrypoint.sh /
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]