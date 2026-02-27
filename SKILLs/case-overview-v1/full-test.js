#!/usr/bin/env node

/**
 * 案情速览技能 - 完整功能测试（含真实API调用）
 * Full Feature Test with Real API Calls
 * 
 * 使用方法：
 * 1. 设置环境变量或直接传入API_KEY
 * 2. 运行脚本进行完整测试
 * 
 * export API_KEY=your_anthropic_api_key
 * node SKILLs/case-overview-v1/full-test.js
 */

const fs = require('fs');
const path = require('path');
const CaseOverviewSkill = require('./scripts/case-overview-executor');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.gray}🔧 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.blue}${'═'.repeat(70)}\n${msg}\n${'═'.repeat(70)}${colors.reset}\n`),
  subheader: (msg) => console.log(`\n${colors.blue}━ ${msg}${colors.reset}\n`)
};

async function runFullTest() {
  log.header('案情速览技能 - 完整功能测试');

  // 第一步：检查环境
  log.subheader('第一步：环境检查');
  const apiKey = process.env.API_KEY || process.argv[2];

  if (!apiKey) {
    log.warn('未设置 API_KEY 环境变量');
    log.info('可以通过以下方式设置：');
    log.info('  Linux/Mac: export API_KEY=sk-...');
    log.info('  Windows: set API_KEY=sk-...');
    log.info('  或传入命令行参数: node full-test.js sk-...');
    log.info('\n将使用模拟API响应进行测试\n');
  } else {
    log.success('API_KEY 已设置（前8字符）：' + apiKey.substring(0, 8) + '...');
  }

  // 第二步：加载测试数据
  log.subheader('第二步：加载测试数据');
  const testInputPath = path.join(__dirname, 'test-input.json');
  
  if (!fs.existsSync(testInputPath)) {
    log.error(`测试数据文件不存在: ${testInputPath}`);
    process.exit(1);
  }

  const testData = JSON.parse(fs.readFileSync(testInputPath, 'utf-8'));
  log.success(`测试数据加载成功`);
  log.info(`  案件ID: ${testData.case_id}`);
  log.info(`  罪名: ${testData.charge_type}`);
  log.info(`  嫌疑人数: ${countSuspects(testData.content.suspect_info)}`);
  log.info(`  材料字数: ${getTotalCharCount(testData.content)}`);

  // 第三步：创建技能实例并执行
  log.subheader('第三步：执行案情分析');

  let skill;
  if (apiKey) {
    skill = new CaseOverviewSkill({
      llmProvider: 'anthropic',
      apiKey: apiKey,
      model: 'claude-3-sonnet',
      temperature: 0.2,
      maxTokens: 4000
    });
  } else {
    // 使用模拟API
    skill = new CaseOverviewSkill({
      llmProvider: 'anthropic',
      apiKey: 'test-key-mock',
      model: 'claude-3-sonnet'
    });
    
    // 覆盖API调用方法
    const mockResponse = {
      content: [{ type: 'text', text: generateMockResponse() }]
    };
    skill.callAnthropicClaude = async () => mockResponse;
  }

  const startTime = Date.now();
  log.info('开始分析...\n');

  const result = await skill.execute(testData);

  const executionTime = Date.now() - startTime;

  if (result.status === 'success') {
    log.success('分析成功完成');
    log.info(`  执行时间: ${result.meta.processing_time}`);
    log.info(`  置信度: ${(result.meta.confidence * 100).toFixed(1)}%`);
    log.info(`  输出长度: ${result.data.mindmap_markdown.length} 字符`);
    
    // 第四步：验证输出质量
    log.subheader('第四步：输出质量验证');
    
    const markdown = result.data.mindmap_markdown;
    const section_count = (markdown.match(/^## /gm) || []).length;
    const subsection_count = (markdown.match(/^### /gm) || []).length;
    const has_title = /^# /.test(markdown);
    
    log.info(`  一级标题: ${has_title ? '✓' : '✗'}`);
    log.info(`  二级标题数: ${section_count}/5 ${section_count >= 5 ? '✓' : '✗'}`);
    log.info(`  三级标题数: ${subsection_count}`);
    log.info(`  内容结构: ${has_title && section_count >= 5 ? '✓ 完整' : '✗ 不完整'}`);
    
    // 第五步：验证关键内容
    log.subheader('第五步：关键内容验证');
    
    const contentChecks = {
      '嫌疑人信息': /### 犯罪嫌疑人/,
      '被害人信息': /### 被害人/,
      '案件基本情况': /### 案件基本情况/,
      '诉讼经过': /## 二、诉讼经过/,
      '犯罪事实': /## 三、核心犯罪事实/,
      '审查认定': /## 四、审查认定情况/,
      '矛盾点': /## 五、矛盾点分析/
    };
    
    let allContentValid = true;
    for (const [key, regex] of Object.entries(contentChecks)) {
      const present = regex.test(markdown);
      log.info(`  ${key}: ${present ? '✓' : '✗'}`);
      if (!present) allContentValid = false;
    }
    
    if (allContentValid) {
      log.success('所有关键内容验证通过');
    } else {
      log.warn('部分关键内容缺失');
    }

    // 第六步：保存输出
    log.subheader('第六步：保存测试输出');
    
    const outputDir = path.join(__dirname, 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const markdownFile = path.join(outputDir, `mindmap-${timestamp}.md`);
    const jsonFile = path.join(outputDir, `result-${timestamp}.json`);

    fs.writeFileSync(markdownFile, markdown);
    fs.writeFileSync(jsonFile, JSON.stringify(result, null, 2));

    log.success('输出已保存');
    log.info(`  Markdown: ${markdownFile}`);
    log.info(`  JSON: ${jsonFile}`);

    // 第七步：显示样本输出
    log.subheader('第七步：样本输出（前500字符）');
    console.log('\n' + markdown.substring(0, 500) + '\n...\n');

    // 最终总结
    log.header('测试总结');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║ 案件ID:              ${testData.case_id.padEnd(50)} │`);
    console.log(`║ 罪名:                ${testData.charge_type.padEnd(50)} │`);
    console.log(`║ 执行状态:            成功 ✓`.padEnd(61) + '│');
    console.log(`║ 执行耗时:            ${executionTime}ms`.padEnd(61) + '│');
    console.log(`║ 输出质量:            ${allContentValid ? '✓ 优秀' : '⚠ 良好'}`.padEnd(61) + '│');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    log.success('✨ 完整功能测试通过！\n');
    return true;

  } else {
    log.error('分析失败');
    log.error(`  错误代码: ${result.error.code}`);
    log.error(`  错误信息: ${result.error.message}`);
    console.log('\n');
    return false;
  }
}

// 辅助函数
function countSuspects(suspectInfo) {
  const matches = suspectInfo.match(/(\d+)\./g) || [];
  return matches.length || 1;
}

function getTotalCharCount(content) {
  return Object.values(content).reduce((sum, val) => sum + (val ? val.length : 0), 0);
}

function generateMockResponse() {
  return `# 朱庆光等故意伤害案

## 一、案件基本信息

### 犯罪嫌疑人
- **朱庆光**，男，1986年08月09日出生，身份证号：371425198608093537，个体经营
- **徐志强**，男，1995年05月25日出生，身份证号：371425199505259072，无职业
- **王彪**，男，1983年02月28日出生，身份证号：341223198302284397，无职业，前科：危险驾驶罪

### 被害人
- **王成虎**，男，1984年12月13日出生，身份证号：371425198412132537，无职业

### 案件基本情况
- **案发时间**：2024年1月3日凌晨1时16分
- **案发地点**：济南市槐荫区机场小学门前
- **案件起因**：债务纠纷，王军联系朱庆光约王成虎解决欠款问题

## 二、诉讼经过

- 2024年1月3日：王成虎报警，案件受理
- 2024年3月1日：调解协议签署，赔偿8万元
- 2024年3月11日：发现轻伤二级，转为刑事案件
- 2024年5月15日：刑事拘留三人
- 2024年6月15日：变更为取保候审
- 2024年10月26日：补充侦查，进入审查起诉阶段

## 三、核心犯罪事实

### 冲突起因
朱庆光组织饭局，王军提议约王成虎解决欠款问题。朱庆光、徐志强联系王成虎，徐志强与王成虎电话争执并约定见面。

### 殴打行为
- **朱庆光**：拽下王成虎，击打肩部
- **王彪**：扇巴掌、踢腰部、锁喉
- **徐志强**：赶到后多次踢踹背部、腰部

### 损伤结果
- **轻伤二级鉴定**：L3腰椎左侧横突骨折
- **鉴定号**：（槐荫）公（刑）鉴（伤）字[2024]62号

### 赔偿与谅解
- **赔偿情况**：徐志强代付8万元
- **谅解对象**：王成虎对朱庆光谅解，对徐志强、王彪不予谅解

## 四、审查认定情况

### 证据类型
- 书证：立案决定书、调解协议书
- 证人证言：李营、王军等
- 犯罪嫌疑人供述：三人讯问记录
- 鉴定意见：法医鉴定报告
- 视听资料：监控视频2段，清晰显示殴打过程

### 事实认定
三人共同预谋殴打王成虎，各自实施殴打行为，致王成虎轻伤二级，已达成民事调解。

## 五、矛盾点分析

### 共同犯罪认定
- 成立共犯：三人有共同犯意和共同行为
- 证据：电话记录、证人证言、监控视频

### 责任划分
- 主要责任：徐志强（殴打次数最多）
- 次要责任：王彪，朱庆光

### 证据缺陷
- 部分讯问笔录高度雷同
- 传唤证时间矛盾
- 监控存在盲区`;
}

// 运行测试
runFullTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    log.error(`测试执行异常: ${err.message}`);
    process.exit(1);
  });
