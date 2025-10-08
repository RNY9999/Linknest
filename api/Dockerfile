# Node 20 の軽量イメージ
FROM node:20-alpine

# 作業ディレクトリ
WORKDIR /app

# 依存だけ先に入れてキャッシュ活用
COPY package*.json ./
RUN npm ci

# ソースは compose の volume でマウントする前提
CMD ["npm", "run", "dev"]
