.PHONY: up down reset dev build clean db-generate db-migrate db-studio

up:
	docker compose up -d

down:
	docker compose down

reset:
	docker compose down -v
	docker compose up -d

dev: up
	pnpm dev

build:
	pnpm -r run build

clean:
	docker compose down -v
	rm -rf apps/*/dist packages/*/dist

db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-studio:
	pnpm db:studio
