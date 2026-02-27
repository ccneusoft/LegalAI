/**
 * 案情速览技能执行器
 * Case Overview Skill Executor
 * 
 * 用途：将案件审查信息转换为标准化Markdown思维导图
 * 支持罪名：故意伤害、危险驾驶、帮信、盗窃、交通肇事、赌博、开设赌场、通用
 */

class CaseOverviewSkill {
  constructor(config = {}) {
    this.config = {
      llmProvider: config.llmProvider || 'anthropic', // 'anthropic', 'openai', 'baidu'
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model || 'claude-3-sonnet',
      temperature: config.temperature || 0.2,
      maxTokens: config.maxTokens || 4000,
      timeout: config.timeout || 30000,
      retryTimes: config.retryTimes || 3,
      ...config
    };

    this.prompts = null;
    this.loadPrompts();
  }

  /**
   * 加载提示词配置
   */
  loadPrompts() {
    // TODO: 从 prompts.yaml 加载或从配置中心获取
    // 这里使用内嵌的基本配置作为默认值
    this.prompts = {
      '故意伤害罪': { order: 1, template: '...' },
      '危险驾驶罪': { order: 2, template: '...' },
      '帮助信息网络犯罪活动罪': { order: 3, template: '...' },
      '盗窃罪': { order: 4, template: '...' },
      '交通肇事罪': { order: 5, template: '...' },
      '赌博罪': { order: 6, template: '...' },
      '开设赌场罪': { order: 7, template: '...' },
      '通用罪名': { order: 8, template: '...' }
    };
  }

  /**
   * 主执行入口
   */
  async execute(inputData) {
    const startTime = Date.now();
    
    try {
      // 1. 参数校验
      this.validate(inputData);
      
      // 2. 获取罪名模板
      const chargeType = inputData.charge_type;
      const promptTemplate = this.getPromptTemplate(chargeType);
      
      // 3. 拼接四部分内容
      const content = this.formatContent(inputData.content);
      
      // 4. 构建完整Prompt
      const messages = this.buildMessages(promptTemplate, content);
      
      // 5. 调用大模型（带重试）
      const response = await this.callLLM(messages);
      
      // 6. 解析结果
      const result = this.parseResponse(response, inputData);
      
      // 7. 返回成功响应
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      return {
        status: 'success',
        data: result,
        meta: {
          case_id: inputData.case_id,
          charge_type: chargeType,
          template_type: promptTemplate.type || '通用',
          confidence: result.confidence || 0.9,
          processing_time: `${processingTime}s`,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      return {
        status: 'error',
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        },
        meta: {
          case_id: inputData.case_id,
          processing_time: `${processingTime}s`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 参数验证
   */
  validate(inputData) {
    // 必填字段检查
    const requiredFields = ['case_id', 'charge_type', 'content'];
    for (const field of requiredFields) {
      if (!inputData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // content 子字段检查
    const contentFields = ['suspect_info', 'case_development', 'investigation_opinion', 'review_facts'];
    for (const field of contentFields) {
      if (!inputData.content[field]) {
        throw new Error(`Missing content field: ${field}`);
      }
    }

    // charge_type 有效性检查
    const supportedCharges = [
      '故意伤害罪',
      '危险驾驶罪',
      '帮助信息网络犯罪活动罪',
      '盗窃罪',
      '交通肇事罪',
      '赌博罪',
      '开设赌场罪'
    ];
    if (!supportedCharges.includes(inputData.charge_type)) {
      console.warn(`Charge type not in predefined list: ${inputData.charge_type}, using generic template`);
    }

    // options 有效性检查
    if (inputData.options) {
      if (inputData.options.expand_level) {
        const level = parseInt(inputData.options.expand_level);
        if (level < 1 || level > 6) {
          throw new Error('expand_level must be between 1 and 6');
        }
      }
    }
  }

  /**
   * 获取罪名对应的提示词模板
   */
  getPromptTemplate(chargeType) {
    const templatesMap = {
      '故意伤害罪': {
        type: '故意伤害罪',
        system: `你是一名资深的法律文书转换专家，精通刑法、刑诉法及Markdown语法。
你的任务是将案件审查材料转换为标准化的Markdown思维导图格式。

【核心要求】
1. 严格遵循输出模板结构，不得增减章节
2. 一级标题仅出现一次（案件名称）
3. 二级标题固定为五大部分，顺序不可变：
   - 一、案件基本信息
   - 二、诉讼经过
   - 三、核心犯罪事实
   - 四、审查认定情况
   - 五、矛盾点分析
4. 若材料缺失某要素，保留标题但写"暂无信息"
5. 不得输出任何解释、注释以外的字符
6. 所有内容必须使用Markdown格式`,
        user: `请将以下《案情速览》内容转换为标准化Markdown文书。

【案情材料】
{content}

【输出要求】
必须严格包含且仅包含以下五大部分：

第一部分：案件基本信息
  - 犯罪嫌疑人：逐个罗列，每行一人（包含：姓名、性别、出生年月、身份证号）
  - 被害人：格式同上
  - 案件基本情况：案发时间、案发地点、案件起因

第二部分：诉讼经过
  - 时间线：按时间升序排列

第三部分：核心犯罪事实（针对故意伤害罪）
  - 冲突起因
  - 殴打行为
  - 损伤结果
  - 赔偿与谅解

第四部分：审查认定情况
  - （一）证据审查
  - （二）审查认定的事实
  - （三）事实与证据分析

第五部分：矛盾点分析
  - 共同犯罪人认定
  - 责任划分
  - 证据冲突

请直接输出Markdown内容，不要添加任何解释说明。`
      },
      '通用罪名': {
        type: '通用罪名',
        system: `你是一名资深的法律文书转换专家，精通刑法、刑诉法及Markdown语法。
你的任务是将案件审查材料转换为标准化的Markdown思维导图格式。

【核心要求】
1. 严格遵循输出模板结构
2. 二级标题固定为五大部分：案件基本信息、诉讼经过、核心犯罪事实、审查认定情况、矛盾点分析
3. 避免过于冗长，保留关键信息
4. 所有内容必须使用Markdown格式`,
        user: `请将以下案件材料转换为标准化Markdown思维导图。

【案情材料】
{content}

【输出要求】
必须包含以下五大部分：

第一部分：案件基本信息
第二部分：诉讼经过
第三部分：核心犯罪事实
第四部分：审查认定情况
第五部分：矛盾点分析

请直接输出Markdown内容，确保结构清晰。`
      }
    };

    // 返回对应的模板，如果没有找到则使用通用模板
    return templatesMap[chargeType] || templatesMap['通用罪名'];
  }

  /**
   * 拼接四部分内容
   */
  formatContent(content) {
    const parts = [
      '===第一部分：犯罪嫌疑人以及其他诉讼参与人的基本情况===',
      content.suspect_info || '暂无信息',
      '',
      '===第二部分：发破案经过===',
      content.case_development || '暂无信息',
      '',
      '===第三部分：侦查机关认定的犯罪事实与意见===',
      content.investigation_opinion || '暂无信息',
      '',
      '===第四部分：审查认定的事实及证据分析===',
      content.review_facts || '暂无信息'
    ];
    return parts.join('\n');
  }

  /**
   * 构建大模型消息
   */
  buildMessages(promptTemplate, content) {
    return [
      {
        role: 'system',
        content: promptTemplate.system
      },
      {
        role: 'user',
        content: promptTemplate.user.replace('{content}', content)
      }
    ];
  }

  /**
   * 调用大模型（带重试机制）
   */
  async callLLM(messages, retryCount = 0) {
    try {
      // TODO: 实现具体的 LLM 调用逻辑
      // 这里仅为框架示意
      
      if (this.config.llmProvider === 'anthropic') {
        return await this.callAnthropicClaude(messages);
      } else if (this.config.llmProvider === 'openai') {
        return await this.callOpenAI(messages);
      } else {
        throw new Error(`Unsupported LLM provider: ${this.config.llmProvider}`);
      }
    } catch (error) {
      // 某些错误不应该被重试
      if (error.code === 'MISSING_API_KEY' || error.code === 'INVALID_API_KEY' || error.code === 'VALIDATION_ERROR') {
        throw error;
      }

      if (retryCount < this.config.retryTimes) {
        console.warn(`LLM call failed, retrying (${retryCount + 1}/${this.config.retryTimes})...`);
        await this.sleep(1000 * (retryCount + 1)); // 指数退避
        return this.callLLM(messages, retryCount + 1);
      }
      throw error;
    }
  }

  async callAnthropicClaude(messages) {
    // 检查 API Key
    if (!this.config.apiKey || this.config.apiKey === 'undefined') {
      const error = new Error('API_KEY is required for Anthropic Claude');
      error.code = 'MISSING_API_KEY';
      throw error;
    }

    // 检查是否为模拟API Key
    if (this.config.apiKey.startsWith('test-key')) {
      const error = new Error('Using test API key, cannot make real API calls. Set a valid Anthropic API_KEY environment variable.');
      error.code = 'INVALID_API_KEY';
      throw error;
    }

    const systemMessage = messages[0]?.content || '';
    const userMessages = messages.slice(1);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemMessage,
        messages: userMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
  }

  async callOpenAI(messages) {
    // 检查 API Key
    if (!this.config.apiKey || this.config.apiKey === 'undefined') {
      const error = new Error('API_KEY is required for OpenAI');
      error.code = 'MISSING_API_KEY';
      throw error;
    }

    const baseUrl = this.config.baseUrl || 'https://api.openai.com';
    
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
  }

  /**
   * 解析大模型响应
   */
  parseResponse(response, inputData) {
    // 从响应中提取 Markdown 内容
    let mindmapMarkdown = '';

    // 处理 Anthropic API 响应格式
    if (response.content && Array.isArray(response.content)) {
      mindmapMarkdown = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    }
    // 处理 OpenAI API 响应格式
    else if (response.choices && Array.isArray(response.choices)) {
      mindmapMarkdown = response.choices[0]?.message?.content || '';
    }
    // 处理其他格式
    else if (typeof response === 'string') {
      mindmapMarkdown = response;
    }

    if (!mindmapMarkdown) {
      throw new Error('No markdown content extracted from API response');
    }

    // 解析结构化数据
    const structuredData = this.extractStructuredData(mindmapMarkdown);

    // 构建特殊源映射（如启用）
    const sourceMapping = inputData.options?.enable_source_map 
      ? this.buildSourceMapping(mindmapMarkdown) 
      : {};

    return {
      mindmap_markdown: mindmapMarkdown,
      structured_data: structuredData,
      source_mapping: sourceMapping,
      confidence: this.calculateConfidence(mindmapMarkdown)
    };
  }

  /**
   * 提取结构化数据
   */
  extractStructuredData(markdown) {
    // TODO: 实现从 Markdown 提取结构化数据的逻辑
    // 这里仅为框架
    return {
      case_name: this.extractCaseName(markdown),
      basic_info: this.extractBasicInfo(markdown),
      litigation_process: [],
      core_facts: {},
      review_findings: {},
      contradictions: {}
    };
  }

  extractCaseName(markdown) {
    const match = markdown.match(/^# (.+?)$/m);
    return match ? match[1].trim() : '未知案件';
  }

  extractBasicInfo(markdown) {
    return {
      who: [],
      when: '',
      where: '',
      why: ''
    };
  }

  /**
   * 构建溯源映射
   */
  buildSourceMapping(markdown) {
    // TODO: 实现节点到卷宗位置的映射
    return {};
  }

  /**
   * 计算置信度
   */
  calculateConfidence(markdown) {
    // TODO: 实现置信度评分逻辑
    // 检查四大部分是否完整、关键信息是否提取等
    const sections = ['## 一、', '## 二、', '## 三、', '## 四、', '## 五、'];
    const foundSections = sections.filter(s => markdown.includes(s)).length;
    return Math.min(foundSections / sections.length + 0.3, 1.0);
  }

  /**
   * 辅助函数：延迟
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = CaseOverviewSkill;

// 命令行使用示例
if (require.main === module) {
  const skill = new CaseOverviewSkill({
    llmProvider: process.env.LLM_PROVIDER || 'anthropic',
    apiKey: process.env.API_KEY,
    model: process.env.MODEL || 'claude-3-sonnet'
  });

  // 从标准输入读取或命令行参数读取
  const inputData = JSON.parse(process.argv[2] || '{}');
  
  skill.execute(inputData).then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Execution failed:', error);
    process.exit(1);
  });
}
