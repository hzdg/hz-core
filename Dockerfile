FROM node:8
WORKDIR /app

COPY package.json /app
COPY yarn.lock /app

# Upgrade yarn
RUN npm install --global yarn

COPY .env /app/.env
RUN bash -c 'source /app/.env && yarn install'

COPY . /app

# Run styleguide
CMD make styleguide

EXPOSE 5000
