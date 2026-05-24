.PHONY: help init up down destroy refresh preview outputs login-backend

PROJECT := $(shell basename $(CURDIR))
STACK ?= dev

help:
	@echo "Available commands:"
	@echo "  make init STACK=<stack>    - Initialize new stack"
	@echo "  make up STACK=<stack>      - Deploy infrastructure"
	@echo "  make down STACK=<stack>    - Pause infrastructure"
	@echo "  make destroy STACK=<stack> - Destroy infrastructure"
	@echo "  make refresh STACK=<stack> - Refresh stack state"
	@echo "  make preview STACK=<stack> - Preview changes"
	@echo "  make outputs STACK=<stack> - Show stack outputs"

login-backend:
	@echo "==> Logging in to Pulumi backend..."
	@../../../shared/backend/login-to-backend.sh

init: login-backend
	@echo "==> Initializing stack: $(STACK)"
	@pulumi stack init $(STACK) || pulumi stack select $(STACK)
	@npm install

up: login-backend
	@echo "==> Deploying $(PROJECT) to $(STACK)..."
	@pulumi up --stack $(STACK) --yes

down:
	@echo "==> Pausing instances in $(STACK)..."
	@pulumi stack --stack $(STACK) output instanceId | xargs -r -I {} aws ec2 stop-instances --instance-ids {}

destroy: login-backend
	@echo "==> Destroying $(PROJECT) in $(STACK)..."
	@pulumi destroy --stack $(STACK) --yes

refresh: login-backend
	@pulumi refresh --stack $(STACK)

preview: login-backend
	@pulumi preview --stack $(STACK)

outputs: login-backend
	@pulumi stack --stack $(STACK) output --json
