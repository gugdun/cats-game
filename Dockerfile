FROM nginx:alpine
WORKDIR /app
COPY . .
RUN apk add --update nodejs npm && \
    npm i && npm run dist && \
    cp -r ./dist/* /usr/share/nginx/html && \
    rm -rf ./* && \
    apk del npm nodejs
EXPOSE 80
