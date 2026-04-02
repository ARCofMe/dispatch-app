FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_OPS_HUB_API_BASE=http://127.0.0.1:8787
ARG VITE_OPS_HUB_API_TOKEN=
ARG VITE_DISPATCHER_ID=

ENV VITE_OPS_HUB_API_BASE=${VITE_OPS_HUB_API_BASE}
ENV VITE_OPS_HUB_API_TOKEN=${VITE_OPS_HUB_API_TOKEN}
ENV VITE_DISPATCHER_ID=${VITE_DISPATCHER_ID}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
