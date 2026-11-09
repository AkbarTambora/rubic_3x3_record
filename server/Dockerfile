FROM node:22-alpine

WORKDIR /app

# Copy packages and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Copy pre-installed node_modules and pre-compiled dist
COPY node_modules ./node_modules
COPY dist ./dist

EXPOSE 5000

# Start Express server
CMD ["node", "dist/index.js"]
