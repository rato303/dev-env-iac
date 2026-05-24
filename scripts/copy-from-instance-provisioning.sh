#!/bin/bash
# instance-provisioningから必要なファイルをコピーするスクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_REPO="/home/ubuntu/instance-provisioning"

echo "==> Copying files from instance-provisioning..."

# 1. IAMリソース（共有リソース）
echo "Copying IAM resources..."
mkdir -p "$REPO_ROOT/iac/pulumi/shared/iam"
cp -r "$SOURCE_REPO/iac/pulumi/iam/"* "$REPO_ROOT/iac/pulumi/shared/iam/"

# 2. Pulumiバックエンド管理ツール
echo "Copying Pulumi backend tools..."
mkdir -p "$REPO_ROOT/iac/pulumi/shared/backend"
cp -r "$SOURCE_REPO/iac/pulumi/tools/maintenance/pulumi-backend/"* "$REPO_ROOT/iac/pulumi/shared/backend/"

# 3. Ansibleロール
echo "Copying Ansible roles..."
mkdir -p "$REPO_ROOT/iac/ansible/roles"
cp -r "$SOURCE_REPO/iac/ansible/roles/"* "$REPO_ROOT/iac/ansible/roles/"

# 4. Ansible group_vars
echo "Copying Ansible group_vars..."
mkdir -p "$REPO_ROOT/iac/ansible/group_vars"
cp "$SOURCE_REPO/iac/ansible/group_vars/all.yml" "$REPO_ROOT/iac/ansible/group_vars/"

# 5. Ansible inventory
echo "Copying Ansible inventory..."
mkdir -p "$REPO_ROOT/iac/ansible/inventory"
cp -r "$SOURCE_REPO/iac/ansible/inventory/"* "$REPO_ROOT/iac/ansible/inventory/"

# 6. Ansible provision.yml（後で拡張が必要）
echo "Copying Ansible provision.yml..."
cp "$SOURCE_REPO/iac/ansible/provision.yml" "$REPO_ROOT/iac/ansible/"

echo ""
echo "✓ Files copied successfully!"
echo ""
echo "Next steps:"
echo "1. Review copied files in iac/pulumi/shared/ and iac/ansible/"
echo "2. Create Pulumi project template"
echo "3. Extend Ansible provision.yml for toolchain selection"
