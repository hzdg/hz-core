FROM node:carbon
WORKDIR /app
COPY package.json /app
RUN yarn install
COPY . /app
CMD yarn styleguide

EXPOSE 5000
