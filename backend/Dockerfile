# ==========================
# Multi-stage build for smaller image
# ==========================

# Base image with minimal dependencies
FROM python:3.11-slim AS base

WORKDIR /app

# Install only essential system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ==========================
# Build stage for ML dependencies
# ==========================
FROM base AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements-base.txt requirements-ml.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --user -r requirements-base.txt && \
    pip install --no-cache-dir --user -r requirements-ml.txt

# ==========================
# Final lightweight image
# ==========================
FROM base AS final

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
WORKDIR /app
COPY . .

# Remove unnecessary files to reduce size
RUN find . -type f -name "*.pyc" -delete && \
    find . -type d -name "__pycache__" -delete && \
    rm -rf .git* && \
    rm -rf tests/ && \
    rm -rf *.md

EXPOSE 5000
CMD ["python", "run.py"]
