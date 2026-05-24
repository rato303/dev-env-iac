# dev-env-iac Makefile
# 複数案件を管理する開発環境IaC

.PHONY: help init list status clean

# デフォルトターゲット
help:
	@echo "==============================================="
	@echo "  dev-env-iac - Multi-Project Development Environment"
	@echo "==============================================="
	@echo ""
	@echo "Available commands:"
	@echo "  make help          - このヘルプを表示"
	@echo "  make init          - 初回セットアップ（バックエンド作成）"
	@echo "  make list          - 全プロジェクト一覧"
	@echo "  make status        - 実行中のインスタンス一覧"
	@echo "  make clean         - 一時ファイルのクリーンアップ"
	@echo ""
	@echo "Phase 1 (Minimum Implementation):"
	@echo "  現在は基本構造のみ実装されています。"
	@echo "  次のステップで機能を追加していきます。"
	@echo ""

init:
	@echo "==> Initializing dev-env-iac..."
	@echo "Phase 1: 基本構造が作成されました"
	@echo ""
	@echo "次のステップ:"
	@echo "1. config/projects.yaml を編集してプロジェクトを定義"
	@echo "2. instance-provisioning からファイルをコピー"
	@echo "3. Pulumi プロジェクトテンプレートを作成"
	@echo ""

list:
	@echo "==> Listing all projects from config/projects.yaml"
	@if [ -f config/projects.yaml ]; then \
		grep -E "^  [a-z0-9-]+:" config/projects.yaml | sed 's/://;s/^  //'; \
	else \
		echo "Error: config/projects.yaml not found"; \
		exit 1; \
	fi

status:
	@echo "==> Current EC2 instances status"
	@echo "Note: This requires AWS CLI and proper credentials"
	@aws ec2 describe-instances \
		--filters "Name=tag:ManagedBy,Values=dev-env-iac" "Name=instance-state-name,Values=running,stopped" \
		--query 'Reservations[*].Instances[*].[Tags[?Key==`Project`].Value|[0],Tags[?Key==`Environment`].Value|[0],InstanceId,State.Name,PublicIpAddress]' \
		--output table 2>/dev/null || echo "AWS CLI not configured or no instances found"

clean:
	@echo "==> Cleaning temporary files..."
	@find . -type f -name "*.retry" -delete
	@find . -type f -name "*.log" -delete
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "Done"
