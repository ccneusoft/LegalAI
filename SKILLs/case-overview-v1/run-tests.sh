#!/bin/bash

# 案情速览技能 - 快速测试启动脚本
# Case Overview Skill - Quick Test Launcher

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                 案情速览技能 - 完整测试启动器                      ║"
echo "║              Case Overview Skill - Complete Test Suite             ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")" || exit 1

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 菜单选择
echo "请选择要运行的测试类型："
echo ""
echo "1) 单元测试          (test-runner.js)"
echo "2) 集成测试          (integration-test.js)"
echo "3) 完整功能测试      (full-test.js)"
echo "4) 运行所有测试"
echo "5) 查看测试总结      (test-summary.js)"
echo "6) 退出"
echo ""
read -p "请输入选项 (1-6): " choice

case $choice in
    1)
        echo ""
        echo "▶ 运行单元测试..."
        node test-runner.js
        ;;
    2)
        echo ""
        echo "▶ 运行集成测试..."
        node integration-test.js
        ;;
    3)
        echo ""
        echo "▶ 运行完整功能测试..."
        node full-test.js
        ;;
    4)
        echo ""
        echo "▶ 运行所有测试..."
        echo ""
        echo "┌─ 第1部分：单元测试 ─────────────────────┐"
        node test-runner.js
        echo ""
        echo "┌─ 第2部分：集成测试 ─────────────────────┐"
        node integration-test.js
        echo ""
        echo "┌─ 第3部分：完整功能测试 ──────────────────┐"
        node full-test.js
        ;;
    5)
        echo ""
        node test-summary.js
        ;;
    6)
        echo "退出"
        exit 0
        ;;
    *)
        echo "❌ 无效的选项"
        exit 1
        ;;
esac

echo ""
echo "✅ 测试执行完成"
