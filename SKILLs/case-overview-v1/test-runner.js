#!/usr/bin/env node

/**
 * 案情速览技能 - 完整测试脚本
 * Test Runner for Case Overview Skill
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
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  test: (msg) => console.log(`\n${colors.blue}━ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}${'═'.repeat(50)}\n${msg}\n${'═'.repeat(50)}${colors.reset}\n`)
};

async function runTests() {
  log.section('案情速览技能 - 完整测试启动');

  let testsPassed = 0;
  let testsFailed = 0;

  // 测试 1: 参数校验
  log.test('测试 1: 参数校验 (Parameter Validation)');
  try {
    const skill = new CaseOverviewSkill({ llmProvider: 'anthropic', apiKey: 'test-key' });
    
    // 1.1 缺少必填字段
    try {
      skill.validate({});
      log.error('缺少必填字段验证失败');
      testsFailed++;
    } catch (e) {
      if (e.message.includes('Missing required field')) {
        log.success('缺少必填字段验证通过');
        testsPassed++;
      }
    }

    // 1.2 缺少 content 字段
    try {
      skill.validate({ case_id: '001', charge_type: '故意伤害罪' });
      log.error('content 字段缺失验证失败');
      testsFailed++;
    } catch (e) {
      if (e.message.includes('Missing required field')) {
        log.success('content 字段缺失验证通过');
        testsPassed++;
      }
    }

    // 1.3 缺少 content 子字段
    try {
      skill.validate({
        case_id: '001',
        charge_type: '故意伤害罪',
        content: { suspect_info: 'test' }
      });
      log.error('content 子字段缺失验证失败');
      testsFailed++;
    } catch (e) {
      if (e.message.includes('Missing content field')) {
        log.success('content 子字段缺失验证通过');
        testsPassed++;
      }
    }

    // 1.4 expand_level 范围检查
    try {
      skill.validate({
        case_id: '001',
        charge_type: '故意伤害罪',
        content: {
          suspect_info: 'test',
          case_development: 'test',
          investigation_opinion: 'test',
          review_facts: 'test'
        },
        options: { expand_level: 10 }
      });
      log.error('expand_level 范围检查失败');
      testsFailed++;
    } catch (e) {
      if (e.message.includes('expand_level must be between')) {
        log.success('expand_level 范围检查通过');
        testsPassed++;
      }
    }

    // 1.5 有效参数通过
    try {
      skill.validate({
        case_id: '001',
        charge_type: '故意伤害罪',
        content: {
          suspect_info: 'test',
          case_development: 'test',
          investigation_opinion: 'test',
          review_facts: 'test'
        },
        options: { expand_level: 3 }
      });
      log.success('有效参数验证通过');
      testsPassed++;
    } catch (e) {
      log.error(`有效参数验证失败: ${e.message}`);
      testsFailed++;
    }

  } catch (e) {
    log.error(`参数校验测试异常: ${e.message}`);
    testsFailed++;
  }

  // 测试 2: 模板获取
  log.test('测试 2: 模板获取 (Prompt Template Loading)');
  try {
    const skill = new CaseOverviewSkill({ llmProvider: 'anthropic', apiKey: 'test-key' });
    
    const template1 = skill.getPromptTemplate('故意伤害罪');
    if (template1.system && template1.user && template1.type === '故意伤害罪') {
      log.success('故意伤害罪模板获取成功');
      testsPassed++;
    } else {
      log.error('故意伤害罪模板格式异常');
      testsFailed++;
    }

    const template2 = skill.getPromptTemplate('未定义罪名');
    if (template2.type === '通用罪名') {
      log.success('未定义罪名使用通用模板');
      testsPassed++;
    } else {
      log.error('未定义罪名模板异常');
      testsFailed++;
    }
  } catch (e) {
    log.error(`模板获取测试异常: ${e.message}`);
    testsFailed++;
  }

  // 测试 3: 内容格式化
  log.test('测试 3: 内容格式化 (Content Formatting)');
  try {
    const skill = new CaseOverviewSkill({ llmProvider: 'anthropic', apiKey: 'test-key' });
    
    const content = skill.formatContent({
      suspect_info: '犯罪嫌疑人：张三',
      case_development: '2024年1月1日发生',
      investigation_opinion: '侦查意见',
      review_facts: '审查事实'
    });

    if (content.includes('===第一部分') && 
        content.includes('犯罪嫌疑人：张三') &&
        content.includes('===第四部分')) {
      log.success('内容格式化成功');
      testsPassed++;
    } else {
      log.error('内容格式化异常');
      testsFailed++;
    }
  } catch (e) {
    log.error(`内容格式化测试异常: ${e.message}`);
    testsFailed++;
  }

  // 测试 4: 消息构建
  log.test('测试 4: 消息构建 (Message Building)');
  try {
    const skill = new CaseOverviewSkill({ llmProvider: 'anthropic', apiKey: 'test-key' });
    
    const template = {
      system: '你是法律专家',
      user: '请分析{content}'
    };
    
    const messages = skill.buildMessages(template, '这是内容');
    
    if (Array.isArray(messages) && 
        messages[0].role === 'system' && 
        messages[1].role === 'user' &&
        messages[1].content.includes('这是内容')) {
      log.success('消息构建成功');
      testsPassed++;
    } else {
      log.error('消息构建异常');
      testsFailed++;
    }
  } catch (e) {
    log.error(`消息构建测试异常: ${e.message}`);
    testsFailed++;
  }

  // 测试 5: 响应解析
  log.test('测试 5: 响应解析 (Response Parsing)');
  try {
    const skill = new CaseOverviewSkill({ llmProvider: 'anthropic', apiKey: 'test-key' });
    
    // 5.1 Anthropic 格式
    const anthropicResponse = {
      content: [{ type: 'text', text: '# 案件名\n## 一、基本信息' }]
    };
    
    const result1 = skill.parseResponse(anthropicResponse, {
      case_id: '001',
      options: {}
    });
    
    if (result1.mindmap_markdown.includes('# 案件名')) {
      log.success('Anthropic 响应解析成功');
      testsPassed++;
    } else {
      log.error('Anthropic 响应解析异常');
      testsFailed++;
    }

    // 5.2 OpenAI 格式
    const openaiResponse = {
      choices: [{ message: { content: '# 案件\n## 信息' } }]
    };
    
    const result2 = skill.parseResponse(openaiResponse, {
      case_id: '002',
      options: {}
    });
    
    if (result2.mindmap_markdown.includes('# 案件')) {
      log.success('OpenAI 响应解析成功');
      testsPassed++;
    } else {
      log.error('OpenAI 响应解析异常');
      testsFailed++;
    }
  } catch (e) {
    log.error(`响应解析测试异常: ${e.message}`);
    testsFailed++;
  }

  // 测试 6: 置信度计算
  log.test('测试 6: 置信度计算 (Confidence Calculation)');
  try {
    const skill = new CaseOverviewSkill({ llmProvider: 'anthropic', apiKey: 'test-key' });
    
    const markdown = `# 案件名
## 一、案件基本信息
内容
## 二、诉讼经过
内容
## 三、核心犯罪事实
内容
## 四、审查认定情况
内容
## 五、矛盾点分析
内容`;
    
    const confidence = skill.calculateConfidence(markdown);
    
    if (confidence > 0.8 && confidence <= 1.0) {
      log.success(`置信度计算正确: ${confidence.toFixed(2)}`);
      testsPassed++;
    } else {
      log.error(`置信度计算异常: ${confidence}`);
      testsFailed++;
    }
  } catch (e) {
    log.error(`置信度计算测试异常: ${e.message}`);
    testsFailed++;
  }

  // 测试 7: 加载测试数据
  log.test('测试 7: 加载测试数据 (Load Test Data)');
  try {
    const testInputPath = path.join(__dirname, 'test-input.json');
    const testData = JSON.parse(fs.readFileSync(testInputPath, 'utf-8'));
    
    if (testData.case_id && testData.charge_type && testData.content) {
      log.success(`测试数据加载成功 (案件ID: ${testData.case_id})`);
      testsPassed++;
    } else {
      log.error('测试数据格式异常');
      testsFailed++;
    }
  } catch (e) {
    log.error(`测试数据加载异常: ${e.message}`);
    testsFailed++;
  }

  // 测试 8: 环境检查
  log.test('测试 8: 环境检查 (Environment Check)');
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      log.warn('未设置 API_KEY 环境变量 - 无法进行 API 调用测试');
      log.info('设置方法: export API_KEY=your_anthropic_api_key');
      testsPassed++;
    } else {
      log.success('API_KEY 已设置');
      testsPassed++;
    }
  } catch (e) {
    log.error(`环境检查异常: ${e.message}`);
    testsFailed++;
  }

  // 输出测试总结
  log.section('测试结果总结');
  log.success(`通过: ${testsPassed}`);
  log.error(`失败: ${testsFailed}`);
  
  const total = testsPassed + testsFailed;
  const percentage = ((testsPassed / total) * 100).toFixed(1);
  
  console.log(`\n总计: ${testsPassed}/${total} (${percentage}%)\n`);

  if (testsFailed === 0) {
    log.success('所有测试通过！✨\n');
    process.exit(0);
  } else {
    log.error(`${testsFailed} 个测试失败\n`);
    process.exit(1);
  }
}

// 运行测试
runTests().catch(err => {
  log.error(`测试执行异常: ${err.message}`);
  process.exit(1);
});
