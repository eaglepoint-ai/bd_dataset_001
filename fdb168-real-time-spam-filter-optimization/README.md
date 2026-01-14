# Spam Filter Optimization

## Prompt

You're a Senior ML Engineer at a cybersecurity firm. The email spam filter is blocking production deployment because training takes 45 seconds and inference latency hits 150ms during peak traffic. Customer support is flooded with complaints about delayed emails during tax season and Black Friday.

The existing SpamFilterV1 class uses CountVectorizer and MultinomialNB, resulting in a 2.3GB memory footprint and a vocabulary of over 100,000 tokens when trained on 5 million emails. Due to a strict 512MB memory limit, the infrastructure team has refused to deploy the model to production containers.

You must optimize the entire SpamFilterV1 class to meet production SLAs while preserving API compatibility.

---

## Problem Statement

The current spam filter violates production constraints due to slow training, high inference latency, and excessive memory usage. The task is to optimize the existing implementation to meet strict performance and memory SLAs while preserving the same API, maintaining acceptable accuracy, and correctly handling obfuscated spam.

---


## Requirements

### Functional Requirements
- Preserve the existing public API (`train()` and `predict()`)
- Raise `RuntimeError("Model not trained")` if `predict()` is called before training
- Raise `ValueError` for invalid or empty training data
- Achieve at least 75% classification accuracy

### Performance Requirements
- Training time ≤ 5 seconds for large-scale datasets
- Inference latency ≤ 50 ms per email (P99)
- Memory usage ≤ 512 MB peak
- Throughput ≥ 1,000 predictions per second

### Technical Constraints
- Python 3.11
- CPU-only execution (no GPU)
- Allowed libraries: scikit-learn, numpy, scipy
- Deterministic behavior across runs
- Must handle obfuscated spam patterns (e.g., "Fr33 m0ney")

---

## Tech Stack

- **Programming Language:** Python 3.11
- **Machine Learning:** scikit-learn
- **Numerical Computing:** numpy, scipy
- **Model Type:** Naive Bayes (baseline implementation)
- **Text Processing:** Bag-of-Words (CountVectorizer)