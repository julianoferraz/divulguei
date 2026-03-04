FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
RUN cp -r src/migrations/sql dist/migrations/sql
RUN npm prune --production
EXPOSE 3001
CMD ["node", "dist/server.js"]
