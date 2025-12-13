# Node 20 の軽量イメージ
FROM node:20-alpine

# 作業ディレクトリ
WORKDIR /app

# 依存だけ先に入れてキャッシュ活用
COPY package*.json ./
COPY nodemon.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY src ./
RUN npm ci && npx prisma studio

# デフォルト起動（compose側のcommandが無くても起動可能）
CMD ["npm", "run", "dev"]