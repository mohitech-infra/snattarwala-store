.PHONY: install dev test build start

install:
	npm ci

dev:
	npm run dev

test:
	npm run lint
	npm run typecheck

build:
	npm run build

start:
	npm run start
