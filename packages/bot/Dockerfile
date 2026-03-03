FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .

CMD ["node", "--loader", "tsx", "src/index.ts"]
