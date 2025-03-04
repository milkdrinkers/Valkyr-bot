FROM node:latest

RUN mkdir -p /usr/src/valkyr
WORKDIR /usr/src/valkyr

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma db push
RUN npm run build

CMD ["npm", "start"]
