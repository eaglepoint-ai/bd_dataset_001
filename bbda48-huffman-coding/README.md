# Huffman Coding Python Project

## Purpose

This project implements **Huffman coding** in Python. It reads a text file, counts character frequencies, builds a Huffman tree using a priority queue, generates optimal binary codes, encodes the text, and displays a summary table with:

- Character frequencies
- Huffman codes
- Original and encoded bit counts
- Compression ratio  

The project includes automated **unit tests** and an **evaluation system** that compares `repository_before` and `repository_after` implementations and generates a machine-readable report.



## Running Tests and Evaluation

Use Docker Compose to run tests and evaluation:

```bash
# Run all unit tests with detailed output
docker compose run test-after
```

# Run evaluation and generate JSON report

```bash
# Run all evaluation results
docker compose run evaluation
```