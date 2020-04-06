FROM nginx:stable

COPY www/ /usr/share/nginx/html

# Document port to run on
ENV PORT=8080
EXPOSE $PORT

# Activate unpriv user
COPY build/nginx.conf /etc/nginx/nginx.conf
COPY build/site.conf /etc/nginx/conf.d/default.conf
RUN touch /var/run/nginx.pid && \
  chown -R www-data:www-data /var/run/nginx.pid && \
  chown -R www-data:www-data /var/cache/nginx
USER www-data
