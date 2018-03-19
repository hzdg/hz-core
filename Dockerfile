FROM node:latest
WORKDIR /app
COPY package.json /app
RUN yarn install
COPY . /app
CMD make styleguide

EXPOSE 5000
