FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git ca-certificates

ARG MINIO_REF=master
ARG MC_REF=master

RUN git clone --depth 1 --branch "${MINIO_REF}" https://github.com/minio/minio.git /src/minio
RUN git clone --depth 1 --branch "${MC_REF}" https://github.com/minio/mc.git /src/mc

RUN cd /src/minio && CGO_ENABLED=0 go build -trimpath -o /out/minio .
RUN cd /src/mc && CGO_ENABLED=0 go build -trimpath -o /out/mc .

FROM alpine:3.22

RUN apk add --no-cache ca-certificates

COPY --from=builder /out/minio /usr/bin/minio
COPY --from=builder /out/mc /usr/bin/mc

RUN chmod +x /usr/bin/minio /usr/bin/mc

EXPOSE 9000 9001
ENTRYPOINT ["/usr/bin/minio"]
