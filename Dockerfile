# Railway Deployment
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
EXPOSE 3001
CMD ["npm", "run", "prod"]
