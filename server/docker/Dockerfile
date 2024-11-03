FROM node:23-bookworm

WORKDIR /app

# Important we are using pnpm
COPY package*.json ./
RUN npm install --only=production

# NodeJS src (copying everything for now), need to imporove size later
COPY . .
# Secrets needed to run later for ENVs
# COPY ./docker/secrets-entrypoint.sh ./docker/secrets-entrypoint.sh
# COPY ./docker/secrets ./docker/secrets

# To set secret enviromental variables in compose.yml,
# we need to run sh script (via ENTRYPOINT) and set them via export
# We also need to change permission to run the file.
# If you still get permission error, run chmod on the file locally since docker copies everything over (including permissions bits) 
# from the source directories.
RUN chmod +x /app/docker/secrets-entrypoint.sh

ENTRYPOINT ["/app/docker/secrets-entrypoint.sh"]

# Build project
RUN npm run build

# Start project
CMD npm start

