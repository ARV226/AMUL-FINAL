FROM node:18-slim

# Install Chromium and required libs
RUN apt-get update && apt-get install -y \
  chromium \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
  libasound2 libatk-bridge2.0-0 libcups2 libdbus-1-3 \
  libgdk-pixbuf2.0-0 libnspr4 libnss3 libxss1 xdg-utils \
  libgtk-3-0 unzip --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "start"]
