# 案情速览技能 - 使用指南

## 🎯 快速开始

### 1. 在 Cowork 会话中使用

最直接的方式是在 Claude 的 Cowork 会话中直接请求案情速览：

```
我需要快速了解这个案件的全貌。请基于以下材料生成案情速览思维导图：

案件号：A3701042700002024016008
罪名：故意伤害罪

【犯罪嫌疑人基本情况】
朱庆光，男，1986年08月09日出生...
[详细信息]

【发破案经过】
2024年1月3日1时16分，王成虎报警...
[详细信息]

【侦查机关意见】
侦查机关认定...
[详细信息]

【审查认定事实】
经审查认定...
[详细信息]
```

系统会自动识别并调用 `case-overview-v1` 技能，生成思维导图并在前端展示。

### 2. 通过 API 调用

```bash
# 使用 curl
curl -X POST http://localhost:3000/api/skills/case-overview-v1 \
  -H "Content-Type: application/json" \
  -d @test-input.json

# 响应示例
{
  "status": "success",
  "data": {
    "mindmap_markdown": "# 案件名称\n## 一、案件基本信息\n...",
    "structured_data": {
      "case_name": "朱庆光、徐志强、王彪故意伤害案",
      ...
    }
  },
  "meta": {
    "charge_type": "故意伤害罪",
    "confidence": 0.95,
    "processing_time": "2.3s"
  }
}
```

### 3. 命令行运行

```bash
# 方式 A：直接传入 JSON 字符串
node scripts/case-overview-executor.js '{
  "case_id": "CASE-001",
  "charge_type": "故意伤害罪",
  ...
}'

# 方式 B：从文件读取
node scripts/case-overview-executor.js < test-input.json

# 方式 C：使用 readfile 和管道
cat test-input.json | node scripts/case-overview-executor.js > output.json
```

## 📊 输入参数详解

### 最小化输入

```json
{
  "case_id": "CASE-2026-001",
  "charge_type": "故意伤害罪",
  "content": {
    "suspect_info": "嫌疑人信息",
    "case_development": "案件经过",
    "investigation_opinion": "侦查意见",
    "review_facts": "审查事实"
  }
}
```

### 完整输入

```json
{
  "case_id": "CASE-2026-001",
  "charge_type": "故意伤害罪",
  "content": {
    "suspect_info": "详细的嫌疑人信息...",
    "case_development": "详细的案件发展过程...",
    "investigation_opinion": "侦查机关的完整意见...",
    "review_facts": "审查认定的完整事实和证据分析..."
  },
  "options": {
    "expand_level": 3,        // 思维导图默认展开层级
    "enable_source_map": true // 启用材料溯源
  }
}
```

### 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| case_id | string | ✓ | - | 案件唯一标识，用于审计追踪 |
| charge_type | string | ✓ | - | 罪名类型，用于匹配 Prompt 模板 |
| content.suspect_info | string | ✓ | - | 犯罪嫌疑人及诉讼参与人基本情况 |
| content.case_development | string | ✓ | - | 发破案经过和诉讼经过 |
| content.investigation_opinion | string | ✓ | - | 侦查机关认定的犯罪事实和意见 |
| content.review_facts | string | ✓ | - | 审查认定的事实及证据分析 |
| options.expand_level | integer | ✗ | 3 | 思维导图默认展开层级，范围 1-6 |
| options.enable_source_map | boolean | ✗ | false | 是否启用材料溯源功能（二期） |

## 🎨 输出示例

### 完整响应

```json
{
  "status": "success",
  "data": {
    "mindmap_markdown": "# 朱庆光、徐志强、王彪故意伤害案\n## 一、案件基本信息\n### 犯罪嫌疑人\n...",
    "structured_data": {
      "case_name": "朱庆光、徐志强、王彪故意伤害案",
      "basic_info": {
        "who": ["朱庆光", "徐志强", "王彪"],
        "when": "2024-01-03 01:16",
        "where": "济南市槐荫区机场小学门口",
        "why": "因债务纠纷引发冲突"
      },
      "litigation_process": [
        { "date": "2024-01-03", "event": "报警" },
        { "date": "2024-03-11", "event": "立案（故意伤害罪）" },
        { "date": "2024-05-15", "event": "刑事拘留" },
        { "date": "2024-06-15", "event": "取保候审" }
      ],
      "core_facts": {
        "who_did_what": "朱庆光、王彪拽下王成虎，徐志强踢踹...",
        "damage": "L3腰椎左侧横突骨折（轻伤二级）",
        "compensation": "赔偿 8 万元已履行"
      },
      "review_findings": {
        "evidence_chain": "完整",
        "procedural_defects": "多项，见程序瑕疵部分",
        "legal_application": "故意伤害罪（刑法第234条）"
      },
      "contradictions": {
        "causation": "致伤原因存在争议",
        "statement_conflicts": "徐志强供述与监控视频有差异"
      }
    },
    "source_mapping": {}
  },
  "meta": {
    "case_id": "A3701042700002024016008",
    "charge_type": "故意伤害罪",
    "template_type": "故意伤害罪",
    "confidence": 0.95,
    "processing_time": "2.3s",
    "timestamp": "2026-02-27T10:30:45.000Z"
  }
}
```

### 错误响应

```json
{
  "status": "error",
  "error": {
    "message": "Missing required field: charge_type",
    "code": "VALIDATION_ERROR"
  },
  "meta": {
    "case_id": "CASE-001",
    "processing_time": "0.1s",
    "timestamp": "2026-02-27T10:30:45.000Z"
  }
}
```

## 🔧 支持的罪名类型

**8 类预定义罪名**：

1. **故意伤害罪** - 最常见，已完全适配
2. **危险驾驶罪** - 酒驾、毒驾等
3. **帮助信息网络犯罪活动罪** - 帮信罪
4. **盗窃罪** - 入户、多次等
5. **交通肇事罪** - 含逃逸情节
6. **赌博罪** - 聚众赌博
7. **开设赌场罪** - 经营性赌博
8. **通用罪名** - 其他罪名使用此模板

**使用建议**：
- ✅ 如果罪名在上述 8 类中，直接使用对应类型
- ✅ 如果不在列表中，设置 `charge_type` 为该罪名（如"贪污罪"），系统会自动使用通用模板
- ✅ 一期支持 8 类，后期会持续扩展

## 💡 使用场景

### 场景 1：快速版书

检察官在审查起诉阶段，需要快速对多个案件进行初审：

```
- 列出本批案件清单
- 对每个案件执行案情速览
- 根据思维导图快速了解案情
- 标记异常或矛盾点
- 决定是否补充侦查
```

### 场景 2：程序审查

审查程序是否合规：

```
- 生成思维导图
- 检查本身列举的"程序瑕疵"部分
- 对比与侦查卷宗中的记录
- 列出需要补正的项目
```

### 场景 3：证据链验证

验证证据是否形成完整链条：

```
- 查看"审查认定情况"中的"证据审查"部分
- 确认"证据链完整性"
- 对于"缺失"的环节进行补充侦查
```

### 场景 4：共犯认定

多人案件中的共犯分析：

```
- 查看"矛盾点分析"中的"共同犯罪人"部分
- 判断是否成立共犯
- 如不成立，考虑变更罪名或撤销
- 确定主从犯
```

## 🎯 最佳实践

### ✅ DO（推荐）

1. **完整提供四部分信息**
   - 确保 `content` 的四个字段都有实质内容
   - 避免留空或只有"同上"、"见上文"这样的引用

2. **准确选择罪名**
   - 根据侦查机关认定的罪名选择 `charge_type`
   - 多数犯罪选用最准确的类型，而非通用

3. **格式规范**
   - 人名、日期使用标准格式
   - 地点信息尽量详细（至少到区/街道）

4. **审查输出质量**
   - 生成后检查思维导图是否有四大部分
   - 确认关键信息（人名、时间、地点）是否准确提取
   - 检查"程序瑕疵"部分是否有遗漏

### ❌ DON'T（不推荐）

1. **信息不完整**
   ```json
   ❌ "content": {
     "suspect_info": "详见侦查卷宗",
     "case_development": "...",
     ...
   }

   ✅ "content": {
     "suspect_info": "朱庆光，男，1986年08月09日出生，...",
     "case_development": "2024年1月3日1时16分...",
     ...
   }
   ```

2. **人名信息不全**
   ```json
   ❌ "suspect_info": "朱庆光等3人"

   ✅ "suspect_info": "朱庆光（男，1986年生...），徐志强（男，1995年生...）..."
   ```

3. **混淆信息部分**
   ```json
   ❌ "content": {
     "case_development": "侦查意见：朱庆光涉嫌...",  // 错了，这是侦查意见
     "investigation_opinion": "2024年1月3日发生..."   // 错了，这是案件经过
   }
   ```

4. **忽视程序瑕疵**
   ```
   ❌ 生成思维导图后不检查"程序瑕疵"部分
   ✅ 每次都要点开"程序瑕疵"子项，看是否有需要补正的地方
   ```

## 📈 性能参数

| 指标 | 值 |
|------|-----|
| 平均响应时间 | 2-3 秒 |
| 最大输入大小 | 5000 字/部分 |
| 最大输出大小 | ~10KB Markdown |
| 并发限制 | 5 个请求/秒 |
| 超时时间 | 30 秒 |

## 🐛 常见问题

### Q1: 为什么思维导图显示不完整？

**A**：可能原因：
- 输入信息不足（内容少于 100 字）
- 大模型生成失败（检查控制台的错误日志）
- 前端渲染错误（检查浏览器控制台）

**解决**：
- 确保输入每部分都有 200+ 字的实质内容
- 刷新页面重试
- 检查是否为大模型 API 超时（增加 timeout 参数）

### Q2: 某些案件信息没有被提取出来？

**A**：可能原因：
- 信息语句表述不清（太简洁或包含多种信息混在一起）
- 大模型对特定格式不熟悉

**解决**：
- 在原始信息中添加更多细节说明
- 如果是特定罪名，检查是否应该换用该罪名的特定 Prompt

### Q3: 思维导图生成速度慢？

**A**：可能原因：
- API 网络延迟
- 输入内容过长
- 系统并发请求过多

**解决**：
- 检查网络连接
- 清理无用的长文本
- 避免多个用户同时请求

### Q4: 能否自定义思维导图结构？

**A**：一期暂不支持自定义，所有罪名都遵循"五大部分"标准结构。

**后期计划**：支持用户自定义模板（二期功能）

## 📞 技术支持

- **功能反馈**：提交 GitHub Issue
- **Bug 报告**：包含输入 JSON 和完整错误堆栈
- **性能问题**：记录响应时间和输入大小
- **集成问题**：提供调用代码片段

## 📚 相关文档

- [完整设计方案](./docs/design-v1.0.md)
- [Prompt 配置说明](./prompts/README.md)
- [前端集成指南](./docs/frontend-integration.md)
- [API 参考](./docs/api-reference.md)

---

**版本**：V1.0  
**最后更新**：2026-02-27  
**维护者**：LegalAI 案件系统组
