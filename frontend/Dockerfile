# We give this stage a name, "builder", so we can refer to it later.
FROM node:20-alpine AS builder

# switch to a dedicated directory. This keeps our project files organized.
WORKDIR /app


# Copy the dependency manifests first. This is a caching trick.
# As long as package.json and yarn.lock don't change, Docker won't
# need to re-install all the node modules, speeding up builds.
COPY package.json yarn.lock ./

RUN yarn install


COPY . .

# Run the build command defined in your package.json.
# This will create a `dist` folder with the optimized, static production files.
RUN yarn build


# --- Stage 2: The Production/Serve Stage ---
# We're done with Node. We now switch to a very tiny and efficient
# Nginx web server image. This keeps our final container small and secure.
FROM nginx:1.27-alpine

# Copy the built static files from the "builder" stage (from /app/dist)
# into the Nginx directory that serves HTML files.
COPY --from=builder /app/dist /usr/share/nginx/html

# Tell Docker the container will listen on port 80
EXPOSE 80
