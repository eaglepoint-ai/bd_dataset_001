#!/bin/bash
# Runs the full lifecycle: Starts the container, executes tests, runs the evaluation script, and saves a timestamped report.json
docker compose run --rm app java -cp evaluation Evaluation
