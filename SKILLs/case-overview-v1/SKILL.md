---
name: case-overview-v1
description: 刑事案件智能助手 - 案情速览技能。自动解析案件审查信息，生成标准化Markdown思维导图，帮助检察官快速了解案件全貌。支持故意伤害、危险驾驶、帮信、盗窃、交通肇事、赌博、开设赌场等7类罪名，以及通用罪名。
---

# 案情速览技能（Case Overview Skill）

## 技能定位

**案情速览技能** 是刑事案件智能辅助办案系统的核心组件，基于案件审查信息，利用大模型自动总结案情，并以思维导图方式直观展示，帮助检察官快速了解案件全貌。

**核心原则**：不替代检察官，只做提效、辅助、合规、留痕

## 核心功能

### 1. 智能解析案件信息
- 自动解析案件审查四部分材料：
  - 犯罪嫌疑人及诉讼参与人基本情况
  - 发破案经过
  - 侦查机关认定的犯罪事实与意见
  - 审查认定的事实及证据分析

### 2. 结构化思维导图生成
- 支持 8 类罪名**模板**：
  - 故意伤害罪
  - 危险驾驶罪
  - 帮助信息网络犯罪活动罪（帮信罪）
  - 盗窃罪
  - 交通肇事罪
  - 赌博罪
  - 开设赌场罪
  - 通用罪名（超出 7 类时使用）

- 每类罪名提供**专用 Prompt 模板**，确保输出结构规范化

### 3. 前端思维导图可视化
- 使用 Markmap.js 将 Markdown 渲染为交互式思维导图
- 默认展开 3 个层级
- 支持放大、缩小、适应屏幕等交互操作
- 三级后续层级手动点击展开

### 4. 材料溯源支持（可选，二期）
- 支持点击思维导图节点溯源到具体卷宗页码
- 精确定位证据来源和引用关系

## 使用场景

- ✅ 案件审查起诉阶段快速案情浏览
- ✅ 补充侦查后的案情汇总对比
- ✅ 多嫌疑人案件的事实梳理
- ✅ 程序瑕疵和证据漏洞的识别
- ✅ 法律适用和争议焦点的分析

## 输入规范

### 输入格式（JSON）

```json
{
  "case_id": "CASE-2026-001",
  "charge_type": "故意伤害罪",
  "content": {
    "suspect_info": "犯罪嫌疑人及诉讼参与人的基本情况...",
    "case_development": "发破案经过...",
    "investigation_opinion": "侦查机关认定的犯罪事实与意见...",
    "review_facts": "审查认定的事实及证据分析..."
  },
  "options": {
    "expand_level": 3,
    "enable_source_map": false
  }
}
```

### 输入参数说明

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| case_id | String | ✓ | 案件唯一标识 |
| charge_type | String | ✓ | 罪名类型（用于匹配Prompt模板） |
| content.suspect_info | String | ✓ | 犯罪嫌疑人基本情况 |
| content.case_development | String | ✓ | 发破案经过 |
| content.investigation_opinion | String | ✓ | 侦查机关意见 |
| content.review_facts | String | ✓ | 审查认定事实 |
| options.expand_level | Integer | ✗ | 思维导图默认展开层级（默认3，范围1-6） |
| options.enable_source_map | Boolean | ✗ | 是否启用材料溯源（默认false） |

## 输出规范

### 输出格式（JSON）

```json
{
  "status": "success",
  "data": {
    "mindmap_markdown": "# 案件名称\n## 一、案件基本信息\n...",
    "structured_data": {
      "case_name": "案件名称",
      "basic_info": {
        "who": ["嫌疑人列表"],
        "when": "案发时间",
        "where": "案发地点",
        "why": "案件起因"
      },
      "litigation_process": [],
      "core_facts": {},
      "review_findings": {},
      "contradictions": {}
    },
    "source_mapping": {}
  },
  "meta": {
    "charge_type": "故意伤害罪",
    "confidence": 0.95,
    "processing_time": "2.3s"
  }
}
```

### 输出字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| status | String | success/error |
| data.mindmap_markdown | String | 思维导图 Markdown 源文本（核心输出） |
| data.structured_data | Object | 结构化案情数据 |
| data.source_mapping | Object | 溯源映射表（节点ID → 卷宗位置） |
| meta.charge_type | String | 实际使用的罪名类型 |
| meta.confidence | Float | 信息提取置信度（0-1） |
| meta.processing_time | String | 处理耗时 |

## 执行流程

```
① 输入校验 
  ↓
② 罪名匹配 → 选择对应 Prompt 模板
  ↓
③ 内容拼接 → 按格式组合四部分内容
  ↓
④ Prompt 构建 → System Prompt + User Prompt
  ↓
⑤ 大模型调用 → Claude/GPT-4/文心4.0
  ↓
⑥ 结果解析 → 提取 Markdown + 结构化数据
  ↓
⑦ 返回输出 → JSON 格式
```

## 集成方式

### 方式 1：命令行调用

```bash
# 从标准输入读取 JSON
cat input.json | node case-overview-v1.js

# 指定输入文件
node case-overview-v1.js --input input.json --output output.json
```

### 方式 2：通过 Claude Agent SDK

在 Cowork 会话中引用该技能，Claude 会根据需要自动调用：

```markdown
# 案情速览

分析以下案件信息并生成思维导图：

- 案件号：A3701042700002024016008
- 罪名：故意伤害罪
- 嫌疑人：朱庆光、徐志强、王彪

[四部分案件材料...]
```

### 方式 3：HTTP API

```bash
curl -X POST http://localhost:3000/api/case-overview \
  -H "Content-Type: application/json" \
  -d @input.json
```

## 前端展示示例

前端使用 **Markmap.js** 将输出的 Markdown 渲染为交互式思维导图：

```html
<div id="mindmap-view"></div>

<script>
  const mindmap = new Markmap('#mindmap-view', {
    autoFit: true,
    expandLevel: 3,      // 默认展开3层
    duration: 500,
    spacingVertical: 10,
    spacingHorizontal: 80
  }, markdownContent);

  // 放大/缩小
  function zoomIn() { mindmap.rescale(1.1); }
  function zoomOut() { mindmap.rescale(0.9); }
  function fitScreen() { mindmap.fit(); }
</script>
```

## 配置文件

本技能使用以下配置文件：

| 文件路径 | 用途 |
|---------|------|
| `prompts/` | 存储 8 类罪名的 Prompt 模板（YAML/JSON） |
| `templates/` | 存储输出 Markdown 模板框架 |
| `scripts/` | 存储执行脚本（Node.js/Python） |

## 关键差异化设计

### 与学术型 AI 案例分析的区别

| 维度 | 通用 LLM | 案情速览技能 |
|------|---------|-----------|
| 输出格式 | 自由文本 | **标准 Markdown 思维导图** |
| 结构化程度 | 低（段落式） | **高（5部分定式）** |
| 罪名适配 | 泛化处理 | **8类罪名专用模板** |
| 可视化 | 无 | **交互式思维导图** |
| 溯源能力 | 无 | **支持点击节点溯源** |
| 合规性 | 需手工检查 | **Prompt 内置审查逻辑** |

## 质量保障

### 置信度评分规则

系统自动评估输出质量：

| 指标 | 权重 | 评分规则 |
|------|------|---------|
| 四部分完整性 | 30% | 四部分都有内容 = 1.0 |
| 结构化程度 | 20% | 按模板生成 = 1.0 |
| 关键要素提取 | 30% | 提取人、时、地、因 = 1.0 |
| 内容匹配度 | 20% | LLM 验证与输入符合度 |

### 输出校验

```python
# 自动检查
- ✓ Markdown 格式有效
- ✓ 五大二级标题齐全
- ✓ 四部分内容非空
- ✓ 关键人名/地点/时间已提取
- ✓ 涉嫌罪名已确认
```

## 限制与注意事项

### 已知限制

1. **内容长度**：输入内容建议不超过 5000 字（单个部分）
2. **语言支持**：目前仅支持简体中文
3. **罪名覆盖**：仅支持 8 类罪名，其他罪名使用"通用"模板
4. **溯源功能**：需要卷宗系统提供文件 ID 和页码支持

### 使用建议

- ✅ 用于**辅助版书**，检察官需进行最终审查
- ✅ 用于**案件汇总**，协助快速了解案情
- ✅ 用于**程序检查**，发现明显的证据缺陷
- ⚠️  **不能**单独作为起诉决定依据
- ⚠️  **不能**替代法律审查和程序审查

## 扩展计划（二期）

- [ ] 证据链可视化（有向图）
- [ ] 时间线交互式展示
- [ ] 矛盾点自动检测告警
- [ ] 多语言支持（英文、繁体中文）
- [ ] 与电子卷宗系统深度集成
- [ ] 支持更多罪名模板（贪腐、涉黑、经济犯罪等）
- [ ] AI 驱动的法律适用建议

## 示例案件

详见本目录下 `examples/` 文件夹（成熟后补充）

## 联系方式

- 功能反馈：提交 Issue 或联系产品组
- 技术支持：查看 `README.md` 获取开发文档

---

**版本**：V1.0  
**发布日期**：2026-02-27  
**维护者**：LegalAI 案件系统组
