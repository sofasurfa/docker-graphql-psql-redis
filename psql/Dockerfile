FROM postgres:16-bookworm

# CMD ["/usr/local/bin/docker-entrypoint.sh","postgres"]


# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    clang \
    curl \
    gcc \
    libssl-dev \
    pkg-config \
    postgresql-server-dev-16 \
    && apt-get clean \ 
    && rm -rf /var/lib/apt/lists/*


# Install postgres UUID v7
RUN cd "$(mktemp -d)"
RUN curl -LO "https://github.com/fboulnois/pg_uuidv7/releases/download/v1.5.0/{pg_uuidv7.tar.gz,SHA256SUMS}"
RUN tar xf pg_uuidv7.tar.gz
RUN sha256sum -c SHA256SUMS
RUN PG_MAJOR=$(pg_config --version | sed 's/^.* \([0-9]\{1,\}\).*$/\1/')
RUN cp "$PG_MAJOR/pg_uuidv7.so" "$(pg_config --pkglibdir)"
RUN cp pg_uuidv7--1.5.sql pg_uuidv7.control "$(pg_config --sharedir)/extension"


