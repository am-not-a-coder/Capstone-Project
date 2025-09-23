# ==========================
# Base image
# ==========================
FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr \
    build-essential \
    cmake \
    libopenblas-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ==========================
# Install base dependencies
# ==========================
FROM base AS deps-base
COPY requirements-base.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements-base.txt

# ==========================
# Install ML dependencies
# ==========================
FROM deps-base AS deps-ml
COPY requirements-ml.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements-ml.txt

# ==========================
# Final image
# ==========================
FROM deps-ml AS final

WORKDIR /app
COPY . .

EXPOSE 5000
CMD ["python", "run.py"]
