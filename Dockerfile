FROM node:latest

RUN mkdir -p /usr/src/continuity
WORKDIR /usr/src/continuity

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
