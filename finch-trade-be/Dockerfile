FROM node:22-alpine
WORKDIR /app/finch-trade-be
COPY finch-trade-be/package*.json ./
RUN npm ci --production
COPY finch-trade-be/ .
COPY shared/ /app/shared/
EXPOSE 5000
CMD ["node", "src/server.js"]
