FROM node:12-alpine
WORKDIR /mtconnect-adapter
COPY . .
RUN npm install
CMD ["node", "emulator.js"]