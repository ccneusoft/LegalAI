// 案情速览技能 - 前端集成示例
// Case Overview Skill - Frontend Integration Example
// 使用 React + Markmap.js

import React, { useState, useEffect, useRef } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import './CaseOverviewView.css';

/**
 * 案情速览组件
 * 接收案件JSON数据，调用技能后在前端展示为交互式思维导图
 */
export default function CaseOverviewView({ caseData, onClose }) {
  const containerRef = useRef(null);
  const [mindmap, setMindmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [expandLevel, setExpandLevel] = useState(3);

  /**
   * 调用案情速览技能 - 通过 Cowork Service
   */
  const generateCaseOverview = async () => {
    setLoading(true);
    setError(null);

    try {
      // 调用 coworkService 或直接调用 API
      const response = await window.electron?.cowork.executeSkill?.('case-overview-v1', {
        case_id: caseData.case_id,
        charge_type: caseData.charge_type || '故意伤害罪',
        content: {
          suspect_info: caseData.suspect_info || '',
          case_development: caseData.case_development || '',
          investigation_opinion: caseData.investigation_opinion || '',
          review_facts: caseData.review_facts || ''
        },
        options: {
          expand_level: expandLevel,
          enable_source_map: false
        }
      });

      if (response.status === 'success') {
        setMarkdownContent(response.data.mindmap_markdown);
        renderMarkmap(response.data.mindmap_markdown);
      } else {
        setError(response.error?.message || '生成失败');
      }
    } catch (err) {
      setError(err.message || '调用技能失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 使用 Markmap 渲染思维导图
   */
  const renderMarkmap = (markdown) => {
    if (!containerRef.current) return;

    try {
      const transformer = new Transformer();
      const { root } = transformer.transform(markdown);

      // 销毁旧的思维导图
      if (mindmap) {
        mindmap.destroy?.();
      }

      // 创建新的思维导图
      const newMindmap = new Markmap(containerRef.current, {
        autoFit: true,
        expandLevel: expandLevel,
        duration: 500,
        spacingVertical: 10,
        spacingHorizontal: 80,
        paddingX: 20,
        paddingY: 20,
        style: {
          line: '#999',
          lineWidth: 1.5,
          text: '#333',
          nodeBg: '#fff',
          nodeBorder: '#ddd'
        }
      }, root);

      // 添加节点点击事件（用于溯源功能）
      newMindmap.on?.('click', (event) => {
        handleNodeClick(event);
      });

      setMindmap(newMindmap);
    } catch (err) {
      setError(`渲染失败: ${err.message}`);
    }
  };

  /**
   * 处理节点点击事件
   */
  const handleNodeClick = (event) => {
    // TODO: 实现溯源功能
    // 如果节点有关联的卷宗信息，弹出溯源面板
    console.log('Node clicked:', event);
  };

  /**
   * 工具栏操作
   */
  const handleZoomIn = () => mindmap?.rescale?.(1.1);
  const handleZoomOut = () => mindmap?.rescale?.(0.9);
  const handleFitScreen = () => mindmap?.fit?.();
  const handleExpandAll = () => {
    // 重新渲染，设置最大展开层级
    renderMarkmap(markdownContent);
  };
  const handleDownload = () => {
    mindmap?.toBlob?.().then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseData.case_id || 'case-overview'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  /**
   * 初始化：监听 expandLevel 变化
   */
  useEffect(() => {
    if (markdownContent) {
      renderMarkmap(markdownContent);
    }
  }, [expandLevel]);

  /**
   * 初始化：加载时自动生成
   */
  useEffect(() => {
    if (caseData) {
      generateCaseOverview();
    }
  }, [caseData]);

  return (
    <div className="case-overview-container">
      {/* 案件信息头 */}
      <div className="case-header">
        <h2>{caseData?.case_id || '案件速览'}</h2>
        <p className="charge-type">
          罪名：<span>{caseData?.charge_type || '待定'}</span>
        </p>
      </div>

      {/* 控制栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button 
            onClick={() => setExpandLevel(Math.max(1, expandLevel - 1))}
            title="减少展开层级"
          >
            ▼ 收起
          </button>
          <span className="expand-level">展开{expandLevel}层</span>
          <button 
            onClick={() => setExpandLevel(Math.min(6, expandLevel + 1))}
            title="增加展开层级"
          >
            展开 ▲
          </button>
        </div>

        <div className="toolbar-center">
          <button onClick={handleZoomOut} title="缩小思维导图">
            ➖ 缩小
          </button>
          <button onClick={handleZoomIn} title="放大思维导图">
            ➕ 放大
          </button>
          <button onClick={handleFitScreen} title="适应屏幕">
            🎯 适应
          </button>
          <button onClick={handleExpandAll} title="全部展开">
            ⬆️ 全展
          </button>
        </div>

        <div className="toolbar-right">
          <button onClick={handleDownload} title="下载为PNG">
            📥 导出
          </button>
          <button onClick={generateCaseOverview} disabled={loading} title="重新生成">
            🔄 {loading ? '生成中...' : '刷新'}
          </button>
          <button onClick={onClose} title="关闭">
            ✕ 关闭
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>正在生成案情速览...</p>
        </div>
      )}

      {/* 思维导图容器 */}
      <div className="mindmap-container" ref={containerRef}></div>

      {/* 底部信息栏 */}
      <div className="status-bar">
        <span>
          {markdownContent ? `✓ 已生成思维导图` : '等待生成...'}
        </span>
        <span className="right">
          案件号：{caseData?.case_id || '-'}
        </span>
      </div>
    </div>
  );
}
