.PHONY: test test-before test-after evaluate clean rebuild logs

# Run tests against repository_after by default
test:
	REPO_UNDER_TEST=repository_after docker compose up --build --abort-on-container-exit

# Explicit before tests
test-before:
	REPO_UNDER_TEST=repository_before docker compose run --rm tests pytest

# Explicit after tests
test-after:
	REPO_UNDER_TEST=repository_after docker compose run --rm tests pytest

# Run official evaluation
evaluate:
	python3 evaluation/evaluation.py

rebuild:
	docker compose build --no-cache

clean:
	docker compose down -v

logs:
	docker compose logs -f
