FROM php:8.4-cli

RUN apt-get update && \
    apt-get install -y \
      git  \
      unzip \
      libzip-dev \
      libpq-dev \
      libpng-dev \
    && docker-php-ext-install zip pdo_pgsql gd exif

COPY --from=composer /usr/bin/composer /usr/bin/composer

WORKDIR /usr/src/

RUN git config --global init.defaultBranch master \
    && git config --global --add safe.directory '*' \
    && composer create-project symfony/skeleton:"^8.0" app \
    && cd app \
    && composer require --dev phpunit/phpunit symfony/test-pack \
    && composer config repositories.0 "{\"type\": \"path\", \"url\": \"../bundle\", \"options\": {\"symlink\": true}}" \
    && composer config "minimum-stability" dev

COPY scripts/ scripts/
RUN chmod +x scripts/*

WORKDIR /usr/src/app

COPY environment .